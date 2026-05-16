(function () {
  "use strict";

  var config = window.LEAD_FORM_CONFIG || {};
  var form = document.querySelector("[data-lead-form]");
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var defaultBtnText = submitBtn ? submitBtn.textContent : "Request Callback";

  function getMessageEl() {
    var el = form.querySelector(".form-message");
    if (!el) {
      el = document.createElement("p");
      el.className = "form-message";
      el.setAttribute("role", "status");
      form.appendChild(el);
    }
    return el;
  }

  function showMessage(text, type) {
    var el = getMessageEl();
    el.textContent = text;
    el.className = "form-message form-message--" + (type || "info");
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "Sending…" : defaultBtnText;
  }

  function buildWhatsAppUrl(name, email, phone) {
    var text =
      "New Lead — " +
      (config.projectName || "Purva Windermere") +
      "\nName: " +
      name +
      "\nEmail: " +
      email +
      "\nPhone: " +
      phone;
    return (
      "https://wa.me/" +
      (config.whatsappNumber || "919902100268") +
      "?text=" +
      encodeURIComponent(text)
    );
  }

  function sendViaWeb3Forms(name, email, phone) {
    var key = (config.web3formsAccessKey || "").trim();
    if (!key) return Promise.resolve({ ok: false, skipped: true });

    var body = new FormData();
    body.append("access_key", key);
    body.append("subject", "New Lead — " + (config.projectName || "Purva Windermere"));
    body.append("from_name", config.formFromName || "Purva Windermere Website");
    body.append("name", name);
    body.append("email", email);
    body.append("phone", phone);
    body.append("message", "Phone: " + phone + " | Email: " + email);

    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: body,
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok && data.success, data: data };
        });
      })
      .catch(function () {
        return { ok: false };
      });
  }

  function sendViaPhp(name, email, phone) {
    if (window.location.protocol === "file:") {
      return Promise.resolve({ ok: false, skipped: true });
    }

    var body = new FormData();
    body.append("name", name);
    body.append("email", email);
    body.append("phone", phone);

    return fetch(config.phpEndpoint || "send-lead.php", {
      method: "POST",
      body: body,
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok && data.success, data: data };
        });
      })
      .catch(function () {
        return { ok: false };
      });
  }

  function notifyWhatsApp(name, email, phone) {
    window.open(buildWhatsAppUrl(name, email, phone), "_blank", "noopener,noreferrer");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var honeypot = form.querySelector('[name="_honey"]');
    if (honeypot && honeypot.value) return;

    var name = (form.querySelector('[name="name"]') || {}).value || "";
    var email = (form.querySelector('[name="email"]') || {}).value || "";
    var phone = (form.querySelector('[name="phone"]') || {}).value || "";

    name = name.trim();
    email = email.trim();
    phone = phone.trim();

    if (!name || !email || !phone) {
      showMessage("Please fill in all fields.", "error");
      return;
    }

    setLoading(true);
    showMessage("Submitting your request…", "info");

    Promise.all([sendViaWeb3Forms(name, email, phone), sendViaPhp(name, email, phone)]).then(
      function (results) {
        var emailSent = results[0].ok || results[1].ok;

        if (emailSent) {
          form.reset();
          showMessage("Thank you! We received your details and will contact you shortly.", "success");
          setLoading(false);
          return;
        }

        notifyWhatsApp(name, email, phone);
        form.reset();
        showMessage(
          "Thank you! Your details were sent to our team on WhatsApp. We will contact you soon.",
          "success"
        );
        setLoading(false);
      }
    );
  });

  if (new URLSearchParams(window.location.search).get("submitted") === "true") {
    showMessage("Thank you! We will contact you shortly.", "success");
  }
})();
