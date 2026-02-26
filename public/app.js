const form = document.getElementById("identify-form");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phoneNumber");
const responseBox = document.getElementById("response-box");
const statusPill = document.getElementById("status-pill");
const submitBtn = document.getElementById("submit-btn");
const clearBtn = document.getElementById("clear-btn");
const sampleButtons = document.querySelectorAll(".chip");

const setStatus = (label, type) => {
  statusPill.textContent = label;
  statusPill.className = "pill";
  if (type) {
    statusPill.classList.add(type);
  }
};

const renderResponse = (value) => {
  responseBox.textContent = JSON.stringify(value, null, 2);
};

const buildPayload = () => {
  const email = emailInput.value.trim();
  const phoneNumber = phoneInput.value.trim();

  const payload = {};
  if (email) {
    payload.email = email;
  }
  if (phoneNumber) {
    payload.phoneNumber = phoneNumber;
  }

  return payload;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildPayload();
  if (!payload.email && !payload.phoneNumber) {
    setStatus("Validation error", "error");
    renderResponse({
      message: "Please enter at least email or phoneNumber.",
    });
    return;
  }

  setStatus("Loading...", null);
  submitBtn.disabled = true;

  try {
    const response = await fetch("/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      setStatus(`Error ${response.status}`, "error");
      renderResponse(body);
      return;
    }

    setStatus(`Success ${response.status}`, "success");
    renderResponse(body);
  } catch (error) {
    setStatus("Network error", "error");
    renderResponse({
      message: "Could not reach server",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    submitBtn.disabled = false;
  }
});

clearBtn.addEventListener("click", () => {
  emailInput.value = "";
  phoneInput.value = "";
  setStatus("Idle", null);
  renderResponse({
    contact: {
      primaryContatctId: null,
      emails: [],
      phoneNumbers: [],
      secondaryContactIds: [],
    },
  });
});

for (const button of sampleButtons) {
  button.addEventListener("click", () => {
    emailInput.value = button.dataset.email || "";
    phoneInput.value = button.dataset.phone || "";
  });
}
