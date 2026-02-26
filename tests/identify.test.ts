import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("POST /identify", () => {
  beforeEach(async () => {
    await prisma.contact.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a primary contact when no matches exist", async () => {
    const response = await request(app).post("/identify").send({
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      contact: {
        primaryContatctId: expect.any(Number),
        emails: ["lorraine@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: [],
      },
    });
  });

  it("creates a secondary contact when request carries new info linked to existing contact", async () => {
    const primary = await prisma.contact.create({
      data: {
        email: "lorraine@hillvalley.edu",
        phoneNumber: "123456",
        linkPrecedence: "primary",
      },
    });

    const response = await request(app).post("/identify").send({
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      contact: {
        primaryContatctId: primary.id,
        emails: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: [expect.any(Number)],
      },
    });
  });

  it("does not create duplicate secondary contact for repeat request", async () => {
    await request(app).post("/identify").send({
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456",
    });

    await request(app).post("/identify").send({
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456",
    });

    const repeatResponse = await request(app).post("/identify").send({
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456",
    });

    const contacts = await prisma.contact.findMany();

    expect(repeatResponse.status).toBe(200);
    expect(contacts).toHaveLength(2);
    expect(repeatResponse.body.contact.secondaryContactIds).toHaveLength(1);
  });

  it("merges two primaries when an incoming request connects them", async () => {
    const olderPrimary = await prisma.contact.create({
      data: {
        email: "george@hillvalley.edu",
        phoneNumber: "919191",
        linkPrecedence: "primary",
        createdAt: new Date("2023-04-11T00:00:00.374Z"),
      },
    });

    const newerPrimary = await prisma.contact.create({
      data: {
        email: "biffsucks@hillvalley.edu",
        phoneNumber: "717171",
        linkPrecedence: "primary",
        createdAt: new Date("2023-04-21T05:30:00.110Z"),
      },
    });

    const response = await request(app).post("/identify").send({
      email: "george@hillvalley.edu",
      phoneNumber: "717171",
    });

    const refreshedNewerPrimary = await prisma.contact.findUnique({
      where: { id: newerPrimary.id },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      contact: {
        primaryContatctId: olderPrimary.id,
        emails: ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
        phoneNumbers: ["919191", "717171"],
        secondaryContactIds: [newerPrimary.id],
      },
    });
    expect(refreshedNewerPrimary?.linkPrecedence).toBe("secondary");
    expect(refreshedNewerPrimary?.linkedId).toBe(olderPrimary.id);
  });

  it("returns 400 when both fields are missing", async () => {
    const response = await request(app).post("/identify").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
  });
});
