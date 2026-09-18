const contactForm =
    document.querySelector(
        "#contact-form"
    );

const contactStatus =
    document.querySelector(
        "#contact-status"
    );

if (contactForm && contactStatus) {

    contactForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            contactStatus.textContent =
                "Sending your message...";

            const formData =
                new FormData(
                    contactForm
                );

            const contactData = {
                name:
                    formData.get("name"),
                email:
                    formData.get("email"),
                orderNumber:
                    formData.get(
                        "orderNumber"
                    ),
                subject:
                    formData.get(
                        "subject"
                    ),
                message:
                    formData.get(
                        "message"
                    )
            };

            try {

                const response =
                    await fetch(
                        "/api/contact",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    contactData
                                )
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Unable to send message."
                    );

                }

                contactStatus.textContent =
                    "Thanks! Your message has been sent. 🐾";

                contactForm.reset();

            } catch (error) {

                console.error(
                    "Contact form error:",
                    error
                );

                contactStatus.textContent =
                    "Sorry, we couldn't send your message. Please try again.";

            }

        }
    );

}