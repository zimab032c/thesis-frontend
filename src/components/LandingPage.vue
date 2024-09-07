<template>
  <div
    class="text-gray-700 min-h-screen flex justify-center pt-8 p-4"
    style="background-color: #e6e6e6"
  >
    <main
      :class="{ typing: !typingComplete, typingComplete: typingComplete }"
      class="flex flex-col gap-4 max-w-3xl text-lg leading-8 tracking-wide text-left"
    >
      <h1 class="text-2xl">{{ typedHeader }}</h1>
      <section class="grid gap-2">
        <h2
          id="introduction"
          class="text-xl uppercase text-gray-600 select-none cursor-default"
        >
          Introduction
        </h2>
        <p>Dear participant,</p>
        <p>
          Thank you for your interest in participating in this study. 
          
          This experiment is designed to deepen our current understanding of user experience with customer support chatbots. Each participant, including yourself, will interact with a specific version of a chatbot. Other participants may encounter different versions. By gathering feedback on these interactions, we aim to explore how design elements influence user perceptions of trust in chatbots within the customer support setting. 
        </p>
      </section>

      <section class="grid gap-2">
        <h2
          id="your-role"
          class="text-xl uppercase text-gray-600 select-none cursor-default"
        >
          Your Role
        </h2>
        <p>
          In this experiment, you will assume the role of a customer who has
          recently made several online purchases from a fictitious online
          retailer. 
        </p>
        <p>You’ve ordered three different items:</p>
        <ul class="list-disc pl-5">
          <li>
            <strong>Order A:</strong> A product that you’re eagerly waiting for.
          </li>
          <li>
            <strong>Order B:</strong> Another item that you purchased recently.
          </li>
          <li>
            <strong>Order C:</strong> An item that has already been delivered to
            you.
          </li>
        </ul>
        <p>
          Now, you need to manage these orders through the retailer’s customer
          support chatbot. Your customer number is <strong><u>123-456</u></strong>. Here’s what you need to do:
        </p>
        <ol class="list-decimal pl-5">
          <li>
            <strong>Track Order A:</strong> You’re curious about the status of
            Order A and want to know its current location and the expected
            delivery date.
          </li>
          <li>
            <strong>Change the Delivery Address for Order B:</strong> You
            realized that you accidentally entered your home address for Order
            B, but it’s meant to be delivered to your office. You want to update
            the delivery address to ensure it arrives at the correct location. (You can invent your own office address, but please follow this exaple format: <strong>Büro Straße 1, 12345 Stadtname</strong>)
          </li>
          <li>
            <strong>Return Order C:</strong> Unfortunately, Order C doesn’t fit
            as expected. Since you know the retailer
            has a 30-day return policy, you decide to initiate a return.
          </li>
        </ol>
      </section>

      <section class="grid gap-2">
        <h2
          id="next-steps"
          class="text-xl uppercase text-gray-600 select-none cursor-default"
        >
          Next Steps
        </h2>
        <p>
          When you have completed all the tasks, you’ll be directed to a
          questionnaire where you can share your feedback and evaluation of the
          chatbot. The entire process, including the chatbot interaction and the
          questionnaire, should take about 20 minutes.
        </p>
      </section>

      <section class="grid gap-2">
        <h2
          id="data-privacy"
          class="text-xl uppercase text-gray-600 select-none cursor-default"
        >
          Data Privacy
        </h2>
        <p>
          The data collected during the experiment will be anonymized and
          securely stored for analysis. Only my supervisors and I will have
          access to the data, and it will not be shared with any third parties.
          If you wish, you can request that your data be permanently deleted at
          any time during or after the experiment.
        </p>
      </section>

      <section class="grid gap-2">
        <h2
          id="voluntary-participation"
          class="text-xl uppercase text-gray-600 select-none cursor-default"
        >
          Voluntary Participation
        </h2>
        <p>
          Your participation is completely voluntary. You are free to stop the
          experiment at any time without needing to provide a reason, and there
          will be no negative consequences for doing so.
        </p>
        <p>
          If you have any questions or concerns after the session, feel free to
          reach out to me at <strong>i.kim@campus.tu-berlin.de</strong>.
        </p>
        <p>
          If you understand and agree to participate in this study, please press
          the button below to begin.
        </p>
      </section>

      <button
        @click="startChat"
        class="mt-4 p-3 bg-lime-300 text-black rounded hover:bg-lime-400 transition hover:underline"
      >
        I Understand, Start the Chat
      </button>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      typedHeader: "",
      typingComplete: false,
    };
  },
  methods: {
    startChat() {
      this.$router.push("/chat"); // Navigate to the chat route
    },
    simulateTyping(message, callback) {
      let index = 0;
      const minSpeed = 50;
      const maxSpeed = 150;

      this.typingComplete = false; // Reset the typing complete flag

      const typeNextChunk = () => {
        this.typedHeader = message.substring(0, index);
        index++;

        if (index <= message.length) {
          setTimeout(
            typeNextChunk,
            Math.random() * (maxSpeed - minSpeed) + minSpeed
          );
        } else {
          // this.typedHeader = message; // Complete the message without the underscore
          this.typingComplete = true; // Set typing complete flag

          // Add a delay to remove the blinking cursor after typing is done
          setTimeout(() => {
            this.typedHeader = message; // Ensure the final message doesn't have the cursor
          }, 100); // Adjust the delay as needed

          if (callback) {
            callback();
          }
        }
      };

      typeNextChunk();
    },
  },
  mounted() {
    this.simulateTyping("Welcome to the Customer Support Chatbot Study");
  },
};
</script>

<style scoped>
@import "../assets/tailwind.css";
@import "../assets/custom-fonts.css";

body {
  margin: 0;
  font-family: "Ubuntu", sans-serif;
}

h1 {
  font-weight: bold;
  font-family: "RubikMonoOne", sans-serif;
  position: relative;
}

h2 {
  font-weight: bold;
  font-family: "Ubuntu", sans-serif;
}

.landing-page-button {
  background-color: #1c2529;
}

.landing-page-button:hover {
  background-color: #dcf34f;
}

.typing h1::after {
  content: "_";
  display: inline-block;
  width: 1px;
  background-color: #000; /* Adjust the color to match your design */
  animation: blink 1s step-end infinite;
  margin-left: 2px; /* Optional: space between the text and the cursor */
}

.typingComplete h1::after {
  content: "";
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
