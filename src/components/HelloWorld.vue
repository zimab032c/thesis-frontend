<template>
  <div
    :class="{ 'blur-background': showCompletionModal || showInfoModal }"
    class="chat-container"
  >
    <audio ref="clickSound" src="/click.mp3" preload="auto" volume="1"></audio>

    <button @click="toggleInfoModal" class="info-button">
      <i class="fas fa-question"></i>
    </button>

    <!-- Messages Container -->
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(message, index) in chatMessages"
        :key="index"
        :class="[
          'message',
          message.role,
          {
            'pill-message': message.type === 'pill',
            typing: message.typing,
          },
          pillMessages[message.pillIndex]?.animationClass,
        ]"
      >
        <template v-if="message.type === 'text'">
          {{ message.content }}
        </template>

        <template v-else-if="message.type === 'pill'">
          <div class="progress-pill" :style="{ width: `${totalPillWidth}px` }">
            <div class="insights">
              {{ pillMessages[message.pillIndex].currentInsight }}
            </div>
            <div class="animation-container">
              <svg
                v-if="!pillMessages[message.pillIndex].showLottieAnimation"
                class="progress-ring"
                width="80"
                height="80"
              >
                <circle
                  ref="progressCircle"
                  class="progress-ring__circle"
                  stroke="#007bff"
                  stroke-width="5"
                  fill="transparent"
                  r="26"
                  cx="40"
                  cy="40"
                  :style="{
                    strokeDashoffset: calculateStrokeDashoffset(
                      pillMessages[message.pillIndex].progress
                    ),
                  }"
                />
              </svg>
              <lottie-player
                v-if="pillMessages[message.pillIndex].showLottieAnimation"
                class="lottie-small"
                :ref="`lottie-${message.pillIndex}`"
                :class="{
                  'special-lottie-animation': pillMessages[
                    message.pillIndex
                  ].insights.includes(
                    'Encountering issues with shipment provider...'
                  ),
                }"
                :src="pillMessages[message.pillIndex].lottieUrl"
                background="transparent"
                speed="1"
                :style="
                  pillMessages[message.pillIndex].insights.includes(
                    'Encountering issues with shipment provider...'
                  )
                    ? 'width: 200px; height: 200px; transform: scale(2.7);'
                    : 'width: 80px; height: 80px; '
                "
                autoplay
                direction="1"
                mode="normal"
              ></lottie-player>
            </div>
          </div>
        </template>
      </div>

      <div v-if="typingMessage" class="message assistant typing-indicator">
        <div class="ticontainer">
          <div class="tiblock">
            <div class="tidot"></div>
            <div class="tidot"></div>
            <div class="tidot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Options Buttons -->
    <div class="options">
      <button
        v-for="(option, index) in currentOptions"
        :key="option"
        @click="playSoundAndSendOption(option)"
        :class="{ 'grayed-out': option.includes('(grayed out)') }"
        :style="{ '--i': index }"
      >
        {{ option }}
      </button>
    </div>

    <!-- Input Field with Integrated Send Button -->
    <div class="input-options">
      <div class="input-field-container">
        <input
          v-model="userMessage"
          @keyup.enter="handleUserInput"
          placeholder="Type your message here..."
        />

        <!-- <audio ref="testAudio" src="/click.mp3"></audio> -->
        <button class="send-button" @click="playSoundAndSendMessage">
          <i class="fas fa-arrow-up"></i>
        </button>
      </div>
    </div>

    <!-- Completion Button -->
    <div
      v-if="tasksCompleted && !showCompletionModal"
      class="completion-button"
      @click="showCompletionModal = true"
    >
      <button class="open-modal-button">
        <i class="fas fa-exclamation"></i>
      </button>
    </div>
    <!-- Completion Button -->
    <!-- <div class="completion-button" @click="showCompletionModal = true">
      <button class="open-modal-button">
        <i class="fas fa-exclamation"></i>
      </button>
    </div> -->
  </div>

  <!-- Info Modal -->
  <div v-if="showInfoModal" class="info-modal">
    <div class="info-content">
      <h2><strong>Help Menu</strong></h2>
      <p>
        This menu provides key task information for the experiment, matching
        what you just read in your briefing.
      </p>
      <h3><strong>Tasks</strong></h3>

      <div class="info-tasks">
        <ul>
          <li>
            <strong>Track Order A:</strong> Check the status and expected
            delivery date of Order A.
          </li>
          <li>
            <strong>Modify Delivery Address for Order B:</strong> Change the
            delivery address for Order B to your office.
          </li>
          <li>
            <strong>Return Order C:</strong> Initiate a return for Order C.
          </li>

          <li><strong>Your Customer Number:</strong> <u>123-456</u></li>
          <li>
            <strong>Office Address Format:</strong> Example: Müller Straße 13,
            10115 Berlin
          </li>
        </ul>
      </div>

      <button @click="toggleInfoModal" class="close-button">Close</button>
    </div>
  </div>

  <!-- Completion Modal -->
  <div v-if="showCompletionModal" class="completion-modal">
    <div class="completion-content">
      <h2><strong>Tasks Completed</strong></h2>
      <p>You have completed all the required tasks.</p>
      <p>
        Would you like to proceed to the questionnaire or continue testing the
        bot?
      </p>
      <div class="modal-buttons">
        <button @click="proceedToQuestionnaire" class="proceed-button">
          Proceed to Questionnaire
        </button>
        <button @click="continueTesting" class="continue-button">
          Keep Testing the Bot
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      userMessage: "",
      responseDelay: 3000,
      chatMessages: [],
      currentOptions: [],
      typingMessage: "",
      showProgressBar: false,
      insights: [
        "Accessing Customer Database...",
        "Retrieving Order History...",
        "Accessing Customer Database...",
        "Retrieving Order History...",
        "Retrieving Order History...",
      ],
      currentInsight: "",
      insightIndex: 0,
      maxInsightWidth: 0,
      showLottieAnimation: false,
      totalPillWidth: 0,
      pillAnimationClass: "",
      pillMessages: [],
      awaitingAddressInput: false,
      currentOrder: "",
      showInfoModal: false,
      showCompletionModal: false,
    };
  },
  beforeCreate() {
    // clear userId from sessionStorage on each reload
    sessionStorage.removeItem("userId");
  },

  mounted() {
    this.maxInsightWidth = this.calculateMaxInsightWidth();
    this.totalPillWidth = this.maxInsightWidth + 200;

    const clickSound = this.$refs.clickSound;

    clickSound.addEventListener("canplaythrough", () => {
      console.log("Click sound is fully loaded and ready to play");
    });

    clickSound.volume = 1;
  },

  async created() {
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("userId", userId);
    }

    this.typingMessage = true;

    try {
      const response = await axios.post(
        "https://thesis-backend-vd4s.onrender.com/api/chat",
        {
          // const response = await axios.post("http://localhost:3000/api/chat", {
          userId,
          message: "",
        }
      );

      this.typingMessage = false;

      // empty message to simulate typing
      this.chatMessages.push({
        role: "assistant",
        content: "",
        type: "text",
      });

      // simulate the typing effect
      this.simulateTyping(response.data.reply, () => {
        this.typingMessage = false;

        // set the available options after typing is complete
        this.currentOptions = response.data.options || [];

        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          container.scrollTop = container.scrollHeight;
        });
      });
    } catch (error) {
      console.error("Error loading initial message:", error);
      this.chatMessages.push({
        role: "assistant",
        content: "Sorry, there was an error loading the initial message.",
        type: "text",
      });
    }
  },

  methods: {
    /**
     * Set up Functions
     */
    resetChat() {
      this.userMessage = "";
      this.chatMessages = [];
      this.currentOptions = [];
      this.typingMessage = false;
    },

    beforeRouteEnter(to, from, next) {
      next((vm) => {
        vm.resetChat();
        vm.startChat();
      });
    },

    setCurrentOrder(order) {
      this.currentOrder = order;
    },

    /**
     * Detection Functions to trigger Pills
     */
    parseOrderFromResponse(responseText) {
      const orderPattern = /(\*\*|__)?Order\s([A-Z])(\*\*|__)?/;
      const match = responseText.match(orderPattern);

      if (match) {
        return match[2];
      }
      return null;
    },

    isSpecialPill(pillIndex) {
      return this.pillMessages[pillIndex]?.isSpecial || false;
    },

    // Detection Functions for Pill Messages
    detectGiftMessage(message) {
      const giftKeywords = [
        "present",
        "happy",
        "birthday",
        "congratulations",
        "best wishes",
        "anniversary",
        "celebrate",
        "thank you",
        "love",
        "for you",
        "dear",
        "with love",
      ];
      const lowercasedMessage = message.toLowerCase();
      const keywordMatch = giftKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
      const patternMatch = /dear|love|wishes|happy|congratulations|from/.test(
        lowercasedMessage
      );

      return keywordMatch || patternMatch;
    },
    detectAddress(message) {
      //more flexible than before
      const AddressPattern =
        /\b[A-Za-zßäöüÄÖÜ]+\s+\d+[a-zA-Z]?\s*,?\s*\d+\s+?[A-Za-zßäöüÄÖÜ]+\b/i;
      return AddressPattern.test(message);
    },
    detectTrackingKeywords(message) {
      const trackingKeywords = [
        "track",
        "tracking",
        "order status",
        "where is my order",
        "track my order",
        "check order status",
        "currently",
        "where is order",
        "where is",
      ];
      const lowercasedMessage = message.toLowerCase();
      return trackingKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },
    detectCancelKeywords(message) {
      const cancelKeywords = ["cancel", "canceling", "cancel order"];
      const lowercasedMessage = message.toLowerCase();
      return cancelKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },
    detectReturnKeywords(message) {
      const returnKeywords = [
        "return",
        "returning",
        "Return",
        "Returning",
        "send back",
        "i want to return order",
      ];
      const lowercasedMessage = message.toLowerCase();
      return returnKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },

    /**
     * Pill Message Functions
     */
    calculateMaxInsightWidth() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "italic 20px Arial";

      let maxWidth = 0;
      this.insights.forEach((insight) => {
        const width = context.measureText(insight).width;
        if (width > maxWidth) maxWidth = width;
      });
      return maxWidth;
    },

    updatePillWidth() {
      const marginAdjustment = 40;
      const ringWidth = 80;
      const paddingAdjustment = 20;
      this.totalPillWidth =
        this.calculateMaxInsightWidth() +
        marginAdjustment +
        ringWidth +
        paddingAdjustment;
    },

    startCyclingInsights(pillIndex) {
      const pillMessage = this.pillMessages[pillIndex];
      pillMessage.insightIndex = 0;
      const totalInsights = pillMessage.insights.length;
      const segmentDuration = 2000;

      const cycleThroughInsights = () => {
        if (pillMessage.insightIndex < totalInsights) {
          pillMessage.currentInsight =
            pillMessage.insights[pillMessage.insightIndex];
          pillMessage.insightIndex++;
          pillMessage.progress =
            (pillMessage.insightIndex / totalInsights) * 100;

          if (pillMessage.insightIndex === totalInsights) {
            pillMessage.showLottieAnimation = true;
            this.stopCyclingInsights(pillIndex);
          }
        }
      };

      pillMessage.intervalId = setInterval(
        cycleThroughInsights,
        segmentDuration
      );
      cycleThroughInsights();
    },

    stopCyclingInsights(pillIndex) {
      const pillMessage = this.pillMessages[pillIndex];
      if (pillMessage.intervalId) {
        clearInterval(pillMessage.intervalId);
        pillMessage.intervalId = null;
      }
    },

    calculateStrokeDashoffset(progress) {
      const radius = 26;
      const circumference = radius * 2 * Math.PI;
      return circumference - (progress / 100) * circumference;
    },

    // risky
    setProgress(circle, percent) {
      const radius = circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;

      circle.style.strokeDasharray = `${circumference} ${circumference}`;

      // if its the final segment, ensure the offset is exactly 0
      let offset = circumference - (percent / 100) * circumference;
      if (percent >= 99.9) {
        offset = 0;
      }

      circle.style.strokeDashoffset = offset;
    },

    animateProgress(circle, insights) {
      const totalInsights = insights.length;
      // calculate segment size
      const segment = 100 / totalInsights;
      // duration for each segment
      const segmentDuration = 1500;

      insights.forEach((insight, index) => {
        setTimeout(() => {
          this.currentInsight = insight;
          let progress = Math.min((index + 1) * segment, 100);

          // last segment should set the progress to exactly 100%
          if (index === totalInsights - 1) {
            progress = 100;
          }
          // set progress for current segment
          this.setProgress(circle, progress);
        }, index * segmentDuration); // pause for 1.5 seconds between segments
      });
    },

    startPillAnimation(pillIndex) {
      console.log("Starting pill animation for pill:", pillIndex);
      const pillMessage = this.pillMessages[pillIndex];

      // check for special pill
      const isSpecialPillMessage = pillMessage.insights.includes(
        "Encountering issues with shipment provider..."
      );

      const lottieUrl = isSpecialPillMessage
        ? "https://lottie.host/d0178bee-39e1-4fe3-b235-18de7784f8d7/PzBoGqgmrh.json"
        : "https://lottie.host/1b945786-25bb-469c-9b7d-afd47c493091/AupOFJL7zQ.json";

      this.$nextTick(() => {
        setTimeout(() => {
          console.log("DOM updated, starting slide-in animation");
          pillMessage.animationClass = "slide-in";
          pillMessage.lottieUrl = lottieUrl;

          this.startCyclingInsights(pillIndex);

          // delay for insight cycling
          const insightsDuration = pillMessage.insights.length * 2000;
          setTimeout(() => {
            pillMessage.animationClass = "completed";
            // trigger lottie animation
            pillMessage.showLottieAnimation = true;

            // collapse pill after lottie animation
            const lottieAnimationDuration = 3000;
            setTimeout(() => {
              pillMessage.animationClass = "collapsed";
            }, lottieAnimationDuration);
          }, insightsDuration + 500);
        }, 50);
      });
    },

    toggleLottieAnimation() {
      this.showLottieAnimation = !this.showLottieAnimation;
    },

    /**
     * Sending Messages Functions
     */
    async sendMessage(isOption = false) {
      if (this.userMessage.trim() === "") return;

      // send custom user input
      if (!isOption) {
        this.chatMessages.push({
          role: "user",
          content: this.userMessage,
          type: "text",
        });
      }

      // auto scroll
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
      });

      this.typingMessage = true;

      let userId = sessionStorage.getItem("userId");
      if (!userId) {
        userId = `user-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("userId", userId);
      }

      try {
        const response = await axios.post(
          "https://thesis-backend-vd4s.onrender.com/api/chat",
          {
            // const response = await axios.post("http://localhost:3000/api/chat", {
            userId,
            message: this.userMessage,
            delay: this.responseDelay,
          }
        );

        // parse order from bot response
        const parsedOrder = this.parseOrderFromResponse(response.data.reply);
        if (parsedOrder) {
          this.setCurrentOrder(parsedOrder);
          // debugging log
          console.log(`Order detected and set: ${parsedOrder}`);
        } else {
          console.log("No order detected in the response");
        }

        // check if bots lost message mentioned Order C and if user is trying to return it
        const lastAssistantMessage = this.chatMessages
          .slice()
          .reverse()
          .find((msg) => msg.role === "assistant" && msg.type === "text");

        const isReturningOrderC =
          lastAssistantMessage &&
          lastAssistantMessage.content.includes("Order C") &&
          this.userMessage.toLowerCase().includes("return");

        console.log("Is returning Order C?", isReturningOrderC);

        // PILL MESSAGE CHECKS
        // special pill check
        if (isReturningOrderC) {
          this.showProgressBar = true;
          this.insights = [
            "Attempting to generate return label...",
            "Encountering issues with shipment provider...",
            "Escalating to human representative...",
            // "Special PILL",
          ];
          console.log("Insights for returning Order C:", this.insights);
        } else if (
          response.data.reply.includes(
            "I'm ready to assist you with your orders."
          ) &&
          this.userMessage.includes("123-456")
        ) {
          this.showProgressBar = true;
          this.insights = [
            // "Costumer Num Pill Success",
            "Accessing Customer Database...",
            "Verifying Customer Identity...",
            "Retrieving Order History...",
            "Operation Complete",
            // "Costumer Num Pill Success",
          ];
        } else if (
          response.data.reply.includes(
            "It seems like the customer number you entered is incorrect. You can find your customer number in the confirmation E-Mail from your last purchase with us (Briefing Sheet)."
          )
        ) {
          this.showProgressBar = true;
          this.insights = [
            // "Costumer Num Pill FAIl",
            "Accessing Customer Database...",
            "Verifying Customer Identity...",
            "Retrieving Order History...",
            "Operation Complete",
            // "Costumer Num Pill FAIl",
          ];
        } else if (this.detectTrackingKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Verifying Order Details...",
            "Accessing Shipment Provider Database...",
            "Fetching Current Shipment Status...",
            "Operations Complete.",
            // "Tracking Pill",
          ];
        } else if (this.detectAddress(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Validating New Address...",
            "Updating Order Details...",
            "Notifying Delivery Service Provider...",
            "Recalculating Delivery Time...",
            // "Mod Addy Pill",
          ];
        } else if (this.detectCancelKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Verifying Order Status...",
            "Checking Cancellation Policy...",
            // "Cancel Pill",
          ];
        } else if (this.detectReturnKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Checking Return Policy...",
            "Verifying Product Eligibility...",
            // "Return Pill",
          ];
        } else if (this.detectGiftMessage(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Adding Gift Message...",
            "Updating Order Details...",
            // "Gift Pill",
          ];
        } else {
          this.showProgressBar = false;
        }

        // delay typing indicator
        setTimeout(() => {
          this.typingMessage = false;

          if (this.showProgressBar) {
            const newPillMessage = {
              insights: [...this.insights],
              currentInsight: this.insights[0],
              insightIndex: 0,
              showLottieAnimation: false,
              progress: 0,
              animationClass: "",
            };
            this.pillMessages.push(newPillMessage);

            this.chatMessages.push({
              role: "assistant",
              type: "pill",
              pillIndex: this.pillMessages.length - 1,
            });

            this.startPillAnimation(this.pillMessages.length - 1);

            // wait for dom before scrolling
            this.$nextTick(() => {
              const container = this.$refs.messagesContainer;
              container.scrollTop = container.scrollHeight;

              const circle = this.$refs.progressCircle;

              // fix: Ensure the circle element exists before trying to set its progress
              if (circle && circle.r && circle.r.baseVal) {
                // start with empty ring
                this.setProgress(circle, 0);
                this.animateProgress(circle, this.insights);
              } else {
                console.error("Progress ring not found?");
              }
            });

            const totalDuration = this.insights.length * 1500 + 500;

            setTimeout(() => {
              this.showProgressBar = false;

              // after the progress bar is done, type out the actual response
              this.chatMessages.push({
                role: "assistant",
                content: "",
                type: "text",
              });
              // simulate typing and render options after completion
              this.simulateTyping(response.data.reply, () => {
                this.updateOptions(response.data.options || []);
                this.currentOptions = response.data.options || [];

                this.$nextTick(() => {
                  const container = this.$refs.messagesContainer;
                  container.scrollTop = container.scrollHeight;

                  // check if tasks are completed and show the completion button if so
                  if (response.data.tasksCompleted) {
                    setTimeout(() => {
                      this.showCompletionModalTrigger();
                    }, 100);
                  }
                });
              });
            }, totalDuration);
          } else {
            // for normal messages (no progress bar)
            this.chatMessages.push({
              role: "assistant",
              content: "",
              type: "text",
            });
            // simulate typing and render options after completion
            this.simulateTyping(response.data.reply, () => {
              this.updateOptions(response.data.options || []);
              this.currentOptions = response.data.options || [];

              this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                container.scrollTop = container.scrollHeight;

                // check if tasks are completed and show the completion modal
                if (response.data.tasksCompleted) {
                  setTimeout(() => {
                    this.showCompletionModalTrigger();
                  }, 100);
                }
              });
            });
          }
        }, 2000); // 2 seconds delay for the typing indicator
      } catch (error) {
        console.error("Error sending message:", error);
        this.typingMessage = false;
        this.chatMessages.push({
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          type: "text",
        });
      }
      //  clear user input after sending
      this.userMessage = "";
    },

    simulateTyping(message, callback) {
      let index = 0;
      const minSpeed = 5;
      const maxSpeed = 10;
      const shortPause = 8;
      const longPause = 18;
      const endPause = 2;
      const minSentenceLengthForPause = 15;
      const keyPauseWords = [
        "therefore",
        "however",
        "because",
        "thus",
        "but",
        "?",
        "!",
      ];
      // clean the message of any options before typing
      const cleanedMessage = message.replace(/Options:.+$/, "").trim();

      const messageElement = this.chatMessages[this.chatMessages.length - 1];
      messageElement.typing = true;

      const typeNextChunk = () => {
        const remainingText = cleanedMessage.substring(index);
        let chunkSize = Math.min(
          Math.floor(Math.random() * 3) + 2,
          remainingText.length
        );
        // random chunk size
        let nextChunk = remainingText.substring(0, chunkSize);

        const periodIndex = nextChunk.indexOf(".");
        const keyWordPause = keyPauseWords.some((word) =>
          nextChunk.includes(word)
        );
        const sentenceLength = messageElement.content.split(" ").length;

        if (periodIndex !== -1 && periodIndex < chunkSize - 1) {
          chunkSize = periodIndex + 1;
          nextChunk = remainingText.substring(0, chunkSize);
        }

        messageElement.content += nextChunk;
        index += chunkSize;

        // auto scroll
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          container.scrollTop = container.scrollHeight;
        });

        if (index < cleanedMessage.length) {
          let delay;

          if (nextChunk.includes(".") || keyWordPause) {
            if (sentenceLength >= minSentenceLengthForPause || keyWordPause) {
              delay = longPause;
            } else {
              delay = shortPause;
            }
          } else {
            delay = Math.random() * (maxSpeed - minSpeed) + minSpeed;
          }

          setTimeout(typeNextChunk, delay);
        } else {
          // Add a small pause at the end to simulate "thinking"
          setTimeout(() => {
            messageElement.typing = false; // Remove the typing indicator after the pause
            if (callback) {
              callback(); // Execute callback after typing is complete
            }
          }, endPause); // Pause before finishing typing
        }
      };

      typeNextChunk(); // Start typing
    },

    // converts option buttons into complete answeres
    getFullUserMessage(input) {
      const order = this.currentOrder || "B";

      const userMessages = {
        Track: `I'd like to receive tracking information regarding Order ${order}.`,
        Cancel: `I want to cancel order ${order}.`,
        "Cancel (disabled)": `I want to cancel order ${order}.`,
        Return: `I'd like to return Order ${order}.`,
        Modify: `I want to modify my order details for Order ${order}.`,
        "Modify (disabled)": `I want to modify my order details for Order ${order}.`,
        "Modify Delivery Address": `I'd like to modify the delivery address for Order ${order}.`,
        "Add Gift Message": `I'd like to add a gift message to Order ${order}.`,
        "Back to Order Operations": `I'd like to go back to the main order operations menu.`,
        "Back to Order Selection": `I want to go back and select a different order to manage.`,
      };

      // exclude custom input
      return userMessages[input] || input;
    },

    updateOptions(newOptions) {
      console.log("updateOptions - newOptions before cleaning:", newOptions);
      const cleanedOptions = this.cleanOptionsForDisplay(newOptions);
      console.log(
        "updateOptions - cleanedOptions after cleaning:",
        cleanedOptions
      );

      this.currentOptions = [];

      // waiting for dom update
      this.$nextTick(() => {
        this.currentOptions = cleanedOptions;

        this.$nextTick(() => {
          const buttons = document.querySelectorAll(".options button");
          console.log("updateOptions - buttons rendered in DOM:", buttons);
          buttons.forEach((button) => {
            button.style.animation = "none";
            button.offsetHeight;
            button.style.animation = "";
          });
        });
      });
    },

    // clean up the "(Previously Selected)" text for rendering
    cleanOptionsForDisplay(options) {
      console.log("Original options received:", options);

      const cleanedOptions = options.map((option) => {
        const cleanedOption = option.replace(" (Previously Selected)", "");
        console.log("Processed option:", cleanedOption);
        return cleanedOption;
      });

      console.log("Final cleaned options:", cleanedOptions);
      return cleanedOptions;
    },

    // modified sendOption method
    sendOption(option) {
      const fullUserMessage = this.getFullUserMessage(option);

      // long message
      this.chatMessages.push({
        role: "user",
        content: fullUserMessage,
        type: "text",
      });

      this.userMessage = option;
      this.sendMessage(true);
    },
    handleUserInput() {
      this.sendMessage(false);
    },

    // click sound for send button
    playSoundAndSendMessage() {
      const clickSound = this.$refs.clickSound;

      clickSound
        .play()
        .then(() => {
          console.log("Sound played successfully via Send Button");
          this.sendMessage();
        })
        .catch((error) => {
          console.error("Error playing sound via Send Button:", error);
          this.sendMessage();
        });
    },

    // click sound for option buttons
    playSoundAndSendOption(option) {
      const clickSound = this.$refs.clickSound;

      clickSound
        .play()
        .then(() => {
          console.log("Sound played successfully via Option Button");
          this.sendOption(option);
        })
        .catch((error) => {
          console.error("Error playing sound via Option Button:", error);
          this.sendOption(option);
        });
    },

    /**
     * Modal Functions
     */
    // trigger modal when all tasks are completed
    showCompletionModalTrigger() {
      this.tasksCompleted = true;
    },

    // redirects to the questionnaire
    proceedToQuestionnaire() {
      const userId = sessionStorage.getItem("userId");

      axios
        .post("http://localhost:3000/api/end-session", {
          userId,
          sessionEnd: true,
        })
        .then(() => {
          // Redirect to the Google Form
          window.location.href =
            "https://docs.google.com/forms/d/e/1FAIpQLSczzL6ne5xJj3e91Q2XjETvT6MrqFDw4BSRl9ZmtMVpD9Rd5g/viewform?usp=sf_link";
        })
        .catch((error) => {
          console.error("Error logging session end:", error);
        });
    },

    // if user wants to continue testing
    continueTesting() {
      this.showCompletionModal = false;
    },

    toggleInfoModal() {
      this.showInfoModal = !this.showInfoModal;
    },
  },
};
</script>

<style>
body,
html {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: auto;
  background-color: #1c2529;
}

.chat-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  overflow: auto;
}

:root {
  --shared-width: 1400px;
}

.messages {
  width: var(--shared-width);
  height: 500px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 40px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-top: 30px;
  background-color: #e6e6e6;
  position: relative;
  overflow-x: hidden;
}

.message {
  position: relative;
  max-width: 80%;
  padding: 10px 20px;
  margin: 10px 10px;
  border-radius: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  word-wrap: break-word;
}

.insights {
  font-style: italic;
  font-size: 16px;
  color: #555;
  display: inline-block;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  margin-left: 40px;

  transition: max-width 2s ease-in-out, opacity 2s ease-in-out;
  max-width: 100%;
}

.pill-message.slide-in {
  transform: translateX(0px);
}

.pill-message {
  overflow: visible;
  transition: transform 0.5s ease-in-out;
  transform: translateX(-700px);
  background-color: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  margin-bottom: 10px;
}

.progress-pill {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: white;
  border-radius: 50px;
  padding: 5px 10px;
  margin: 5px 0;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
  transition: width 2s ease-in-out;
  width: 100%;
}

.pill-message.completed {
  transform: none;
  background-color: #fff;
  padding: 10px 20px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  position: relative;
  margin-bottom: 10px;
}

.pill-message.collapsed {
  transform: translateX(-420px);
}

.pill-message.collapsed:hover {
  transform: translateX(0px);
}

.user,
.assistant {
  font-family: "Poppins", sans-serif;
  font-size: 18px;
}

.user {
  align-self: flex-end;
  background-color: #c0cfd1;
  color: black;
  margin-left: auto;
  margin-right: 10px;
  text-align: right;
}

.user::after {
  content: "";
  position: absolute;
  top: 10px;
  right: -20px;
  width: 0;
  height: 0;
  border: 30px solid transparent;
  border-left-color: #c0cfd1;
  border-right: none;
  border-top: none;
}

.assistant {
  align-self: flex-start;
  background-color: #141e22;
  color: white;
  margin-left: 10px;
  text-align: left;
  max-width: 70%;
}

.assistant::before {
  content: "";
  position: absolute;
  top: 10px;
  left: -20px;
  width: 0;
  height: 0;
  border: 30px solid transparent;
  border-right-color: #141e22;
  border-left: none;
  border-top: none;
}

.message.assistant.typing-indicator::before {
  top: 5px;
}

.message.assistant.typing-indicator {
  position: relative;
}

.pill-message::before {
  content: none;
}

.input-options {
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-field-container {
  display: flex;
  width: 800px;
  align-items: center;
  border-radius: 50px;
  border: 1px solid #ccc;
  background-color: #c0cfd1;
  overflow: hidden;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  height: 60px;
  margin-bottom: 20px;
}

.input-options input {
  width: calc(100% - 100px);
  flex-grow: 1;
  height: 50px;
  border: none;
  background-color: transparent;
  color: black;
  padding-left: 50px;
  outline: none;
  font-size: 16px;
}

.send-button {
  margin-right: 10px;
  background-color: #dcf34f;
  color: black;
  border: none;
  width: 100px;
  height: 50px;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes fadeInPopup {
  0% {
    opacity: 0;
    top: 50px;
  }
  100% {
    opacity: 1;
    top: 0px;
  }
}

.options {
  margin-top: 20px;
  margin-bottom: 40px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.options button {
  opacity: 0;
  position: relative;
  top: 50px;
  animation: fadeInPopup 0.5s forwards ease-out;
  animation-delay: calc(var(--i) * 0.2s);
  margin: 5px;
  margin-top: 20px;
  padding: 20px 30px;
  background-color: white;
  color: #1c2529;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: box-shadow 0.3s ease-in-out, background-color 0.3s;
  box-shadow: 0 5px 0 gray;
}

button:hover {
  background-color: #dcf34f;
  color: #141e22;
  transform: translateY(3px);
  box-shadow: 0 6px 12px rgba(220, 243, 79, 0.5);
}

button:active {
  color: white;
  transform: translateY(1px);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 243, 79, 0.75);
}

.grayed-out {
  background-color: #ddd;
  color: #666;
}

.animation-container {
  margin-left: auto;
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
}

.progress-ring__circle {
  stroke: #dcf34f;
  stroke-width: 3.5;
  fill: transparent;
  stroke-dasharray: 163.36;
  stroke-dashoffset: 163.36;
  transition: stroke-dashoffset 1.5s linear;
}

.lottie-container {
  margin-top: 10px;
}

.messages::-webkit-scrollbar {
  width: 8px;
}

.messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages::-webkit-scrollbar-thumb {
  background: #888;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.tiblock {
  align-items: center;
  display: flex;
  height: 17px;
}

.ticontainer .tidot {
  background-color: #90949c;
}

.tidot {
  background-color: #90949c;
  border-radius: 50%;
  display: inline-block;
  height: 8px;
  margin-right: 4px;
  width: 8px;
  animation: mercuryTypingAnimation 1.5s infinite ease-in-out;
}

@keyframes mercuryTypingAnimation {
  0% {
    transform: translateY(0px);
  }
  28% {
    transform: translateY(-5px);
  }
  44% {
    transform: translateY(0px);
  }
}

.tidot:nth-child(1) {
  animation-delay: 0s;
}
.tidot:nth-child(2) {
  animation-delay: 0.15s;
}
.tidot:nth-child(3) {
  animation-delay: 0.3s;
}

.message.assistant.typing::after {
  content: "_";
  display: inline-block;
  width: 1px;
  background-color: #000;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  from,
  to {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Info Button */
.info-button {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #dcf34f;
  color: black;
  border: none;
  width: 60px;
  height: 60px;
  font-size: 20px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Info Modal */
.info-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  width: 80%;
  max-width: 500px;
}

.info-content h2,
.info-content h3 {
  margin-bottom: 5px;
  font-size: 20px;
}

.info-content p,
.info-content ul {
  margin-bottom: 10px;
  font-size: 18px;
}

.info-tasks ul li {
  text-align: left;
  list-style-type: disc;
  margin-left: 50px;
}

.close-button {
  background-color: #dcf34f;
  color: black;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 5px;
}

/* Completion Modal */
.completion-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  width: 80%;
  max-width: 400px;
}

/* blur effect when the modal is open */
.blur-background {
  filter: blur(5px);
  pointer-events: none;
}

.completion-content h2 {
  margin-bottom: 20px;
  font-size: 24px;
}

.completion-content p {
  margin-bottom: 20px;
  font-size: 18px;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.proceed-button,
.continue-button {
  background-color: #dcf34f;
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 15px;
}

/* button for opening the completion modal */
.completion-button {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 20px;
  right: 100px;
  background-color: #dcf34f;
  color: black;
  border: none;
  width: 60px;
  height: 60px;
  font-size: 20px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Add hover effect for Completion Button */
.completion-button:hover {
  background-color: #dcf34f;
  color: #141e22;
  transform: translateY(3px);
  box-shadow: 0 6px 12px rgba(220, 243, 79, 0.5);
}
</style>
