import { Contact, LinkPrecedence, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConsolidatedContact, IdentifyInput, IdentifyResponse } from "../types/identify";

const toRootPrimaryId = (contact: Contact): number => {
  if (contact.linkPrecedence === LinkPrecedence.primary) {
    return contact.id;
  }

  return contact.linkedId ?? contact.id;
};

const sortByCreatedAt = (a: Contact, b: Contact): number => {
  const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return a.id - b.id;
};

const pickOldestPrimary = (primaries: Contact[]): Contact => {
  const sorted = [...primaries].sort(sortByCreatedAt);
  return sorted[0];
};

const dedupeWithPrimaryFirst = (primaryValue: string | null, values: Array<string | null>): string[] => {
  const ordered: string[] = [];

  if (primaryValue) {
    ordered.push(primaryValue);
  }

  for (const value of values) {
    if (!value || ordered.includes(value)) {
      continue;
    }
    ordered.push(value);
  }

  return ordered;
};

const buildConsolidatedContact = (primary: Contact, group: Contact[]): ConsolidatedContact => {
  const sortedGroup = [...group].sort(sortByCreatedAt);

  return {
    primaryContatctId: primary.id,
    emails: dedupeWithPrimaryFirst(primary.email, sortedGroup.map((contact) => contact.email)),
    phoneNumbers: dedupeWithPrimaryFirst(
      primary.phoneNumber,
      sortedGroup.map((contact) => contact.phoneNumber),
    ),
    secondaryContactIds: sortedGroup
      .filter((contact) => contact.id !== primary.id)
      .map((contact) => contact.id),
  };
};

const fetchLinkedGroup = async (
  tx: Prisma.TransactionClient,
  rootPrimaryIds: number[],
): Promise<Contact[]> => {
  return tx.contact.findMany({
    where: {
      OR: [{ id: { in: rootPrimaryIds } }, { linkedId: { in: rootPrimaryIds } }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
};

export const identifyContact = async (input: IdentifyInput): Promise<IdentifyResponse> => {
  return prisma.$transaction(async (tx) => {
    const matchClauses: Prisma.ContactWhereInput[] = [];

    if (input.email) {
      matchClauses.push({ email: input.email });
    }

    if (input.phoneNumber) {
      matchClauses.push({ phoneNumber: input.phoneNumber });
    }

    const directMatches = await tx.contact.findMany({
      where: {
        OR: matchClauses,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    if (directMatches.length === 0) {
      const newPrimary = await tx.contact.create({
        data: {
          email: input.email,
          phoneNumber: input.phoneNumber,
          linkPrecedence: LinkPrecedence.primary,
          linkedId: null,
        },
      });

      return {
        contact: buildConsolidatedContact(newPrimary, [newPrimary]),
      };
    }

    const rootPrimaryIds = [...new Set(directMatches.map(toRootPrimaryId))];
    let group = await fetchLinkedGroup(tx, rootPrimaryIds);
    let primaryContacts = group.filter((contact) => contact.linkPrecedence === LinkPrecedence.primary);

    if (primaryContacts.length > 1) {
      const winnerPrimary = pickOldestPrimary(primaryContacts);
      const loserPrimaryIds = primaryContacts
        .filter((contact) => contact.id !== winnerPrimary.id)
        .map((contact) => contact.id);

      if (loserPrimaryIds.length > 0) {
        await tx.contact.updateMany({
          where: {
            id: { in: loserPrimaryIds },
          },
          data: {
            linkPrecedence: LinkPrecedence.secondary,
            linkedId: winnerPrimary.id,
          },
        });

        await tx.contact.updateMany({
          where: {
            linkedId: { in: loserPrimaryIds },
          },
          data: {
            linkedId: winnerPrimary.id,
          },
        });
      }

      group = await fetchLinkedGroup(tx, [winnerPrimary.id]);
      primaryContacts = group.filter((contact) => contact.linkPrecedence === LinkPrecedence.primary);
    }

    if (primaryContacts.length === 0) {
      const fallbackPrimary = pickOldestPrimary(group);
      await tx.contact.update({
        where: { id: fallbackPrimary.id },
        data: {
          linkPrecedence: LinkPrecedence.primary,
          linkedId: null,
        },
      });

      group = await fetchLinkedGroup(tx, [fallbackPrimary.id]);
      primaryContacts = group.filter((contact) => contact.linkPrecedence === LinkPrecedence.primary);
    }

    const primary = pickOldestPrimary(primaryContacts);

    const knownEmails = new Set(group.map((contact) => contact.email).filter(Boolean) as string[]);
    const knownPhoneNumbers = new Set(
      group.map((contact) => contact.phoneNumber).filter(Boolean) as string[],
    );

    const hasNewEmail = Boolean(input.email && !knownEmails.has(input.email));
    const hasNewPhoneNumber = Boolean(input.phoneNumber && !knownPhoneNumbers.has(input.phoneNumber));

    if (hasNewEmail || hasNewPhoneNumber) {
      const newSecondary = await tx.contact.create({
        data: {
          email: input.email,
          phoneNumber: input.phoneNumber,
          linkedId: primary.id,
          linkPrecedence: LinkPrecedence.secondary,
        },
      });

      group.push(newSecondary);
    }

    return {
      contact: buildConsolidatedContact(primary, group),
    };
  });
};
