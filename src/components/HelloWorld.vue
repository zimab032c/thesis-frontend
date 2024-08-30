<template>
  <div class="chat-container">
    <audio ref="clickSound" src="/click.mp3" preload="auto" volume="1"></audio>

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
          <!-- Attach the sound to this button -->
          <i class="fas fa-arrow-up"></i>
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
      responseDelay: 3000, // Default delay of 3 seconds
      chatMessages: [], // Start empty, will populate from server
      currentOptions: [], // Options for the user to select
      typingMessage: "", // Temporary storage for the typing effect
      showProgressBar: false, // State to control progress bar visibility
      insights: [
        "Accessing Customer Database...",
        "Retrieving Order History...",
        "Accessing Customer Database...",
        "Retrieving Order History...",
        "Retrieving Order History...",
      ],
      currentInsight: "",
      insightIndex: 0,
      maxInsightWidth: 0, // Max width of insights
      showLottieAnimation: false,
      totalPillWidth: 0, // Width of the pill
      pillAnimationClass: "", // Animation class for the pill
      pillMessages: [], // Array to store individual pill message states
      awaitingAddressInput: false, // Flag to determine if we're awaiting address input
      currentOrder: "", // Track the current order being referenced
    };
  },
  beforeCreate() {
    // Clear userId from sessionStorage on each reload
    sessionStorage.removeItem("userId");
  },

  mounted() {

    // Calculate the max width of the insights based on the longest insight
    this.maxInsightWidth = this.calculateMaxInsightWidth();
    this.totalPillWidth = this.maxInsightWidth + 200; // Adjusted for padding, ring, and left extension

    const clickSound = this.$refs.clickSound;

    clickSound.addEventListener("canplaythrough", () => {
      console.log("Click sound is fully loaded and ready to play");
    });

    clickSound.volume = 1;

    // Use $nextTick to ensure that DOM is fully updated before attaching event listeners
    // this.$nextTick(() => {
    //   const buttons = document.querySelectorAll(".options button");
    //   buttons.forEach((button) => {
    //     button.addEventListener("click", () => {
    //       console.log("Button clicked, attempting to play sound");
    //       audio
    //         .play()
    //         .then(() => {
    //           console.log("Sound played successfully");
    //         })
    //         .catch((error) => {
    //           console.error("Error playing sound:", error);
    //         });
    //     });
    //   });
    // });
  },
  async created() {
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID
      sessionStorage.setItem("userId", userId);
    }

    this.typingMessage = true; // Show typing indicator

    try {
      const response = await axios.post("https://thesis-backend-vd4s.onrender.com/api/chat", {
        userId,
        message: "", // Trigger initial introduction
      });

      this.typingMessage = false; // Show typing indicator

      // Add an empty message to the chatMessages array to simulate typing
      this.chatMessages.push({
        role: "assistant",
        content: "", // Start with an empty content
        type: "text",
      });

      // Simulate the typing effect
      this.simulateTyping(response.data.reply, () => {
        this.typingMessage = false; // Hide typing indicator after typing is complete

        // Set the available options after typing is complete
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
    resetChat() {
      this.userMessage = "";
      this.chatMessages = []; // Clear previous messages
      this.currentOptions = []; // Clear any previous options
      this.typingMessage = false; // Reset typing indicator
      // Reset other states if necessary
    },
    beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.resetChat(); // Reset the chat when entering the route
      vm.startChat(); // Start a new conversation
    });
  },
    playSoundAndSendMessage() {
      const clickSound = this.$refs.clickSound;

      clickSound
        .play()
        .then(() => {
          console.log("Sound played successfully via Send Button");
          this.sendMessage(); // Send the message after the sound starts playing
        })
        .catch((error) => {
          console.error("Error playing sound via Send Button:", error);
          this.sendMessage(); // Send the message even if there's an error playing the sound
        });
    },
    playSoundAndSendOption(option) {
      const clickSound = this.$refs.clickSound;

      clickSound
        .play()
        .then(() => {
          console.log("Sound played successfully via Option Button");
          this.sendOption(option); // Send the option after the sound starts playing
        })
        .catch((error) => {
          console.error("Error playing sound via Option Button:", error);
          this.sendOption(option); // Send the option even if there's an error playing the sound
        });
    },
    getFullUserMessage(input) {
      const order = this.currentOrder || "B"; // Default to "A" if no order is set

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

      return userMessages[input] || input; // Fallback to input if no match is found
    },

    // Function to set the current order based on user action
    setCurrentOrder(order) {
      this.currentOrder = order;
    },

    parseOrderFromResponse(responseText) {
      // Regular expression to match "Order X" where X can be A, B, C, etc.
      // The regex accounts for possible bold formatting (e.g., **Order A**)
      const orderPattern = /(\*\*|__)?Order\s([A-Z])(\*\*|__)?/;
      const match = responseText.match(orderPattern);

      if (match) {
        return match[2]; // Returns the letter corresponding to the order
      }
      return null; // Return null if no order is found
    },

    // Define the isSpecialPill method to check for special pills
    isSpecialPill(pillIndex) {
      // Implement your logic to identify if a pill is special
      // For example, you might check a specific condition in pillMessages
      return this.pillMessages[pillIndex]?.isSpecial || false;
    },
    // Function to detect keywords or patterns that suggest a gift message
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

      // Check if the message contains any of the keywords
      const lowercasedMessage = message.toLowerCase();
      const keywordMatch = giftKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );

      // Check for common patterns in gift messages
      const patternMatch = /dear|love|wishes|happy|congratulations|from/.test(
        lowercasedMessage
      );

      // Combine both checks
      return keywordMatch || patternMatch;
    },
    detectAddress(message) {
      // Improved Regular Expression for German Addresses
      const germanAddressPattern =
        /\b[A-Za-zßäöüÄÖÜ]+\s+\d+\s*,?\s*\d{5}\s+[A-Za-zßäöüÄÖÜ]+\b/i;
      return germanAddressPattern.test(message);
    },
    // Function to detect tracking-related keywords
    detectTrackingKeywords(message) {
      const trackingKeywords = [
        "track",
        "tracking",
        "order status",
        "where is my order",
        "track my order",
        "check order status",
      ];
      const lowercasedMessage = message.toLowerCase();
      return trackingKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },
    // Function to detect cancel-related keywords
    detectCancelKeywords(message) {
      const cancelKeywords = ["cancel", "canceling", "cancel order"];
      const lowercasedMessage = message.toLowerCase();
      return cancelKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },
    // Function to detect tracking-related keywords
    detectReturnKeywords(message) {
      const returnKeywords = [
        "return",
        "returning",
        "Return",
        "returning",
        "i want to return order",
      ];
      const lowercasedMessage = message.toLowerCase();
      return returnKeywords.some((keyword) =>
        lowercasedMessage.includes(keyword)
      );
    },
    calculateStrokeDashoffset(progress) {
      const radius = 26;
      const circumference = radius * 2 * Math.PI;
      return circumference - (progress / 100) * circumference;
    },
    updateOptions(newOptions) {
      this.currentOptions = newOptions;

      // Trigger reflow to restart CSS animations
      this.$nextTick(() => {
        const buttons = document.querySelectorAll(".options button");
        buttons.forEach((button) => {
          //button.style.opacity = 0; // Reset opacity to trigger animation
          button.style.animation = "none"; // Reset animation
          button.offsetHeight; // Trigger reflow
          button.style.animation = ""; // Restore animation
        });
      });
    },

    calculateMaxInsightWidth() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "italic 20px Arial"; // Match the font style in CSS

      let maxWidth = 0;
      this.insights.forEach((insight) => {
        const width = context.measureText(insight).width;
        if (width > maxWidth) maxWidth = width;
      });
      return maxWidth;
    },
    updatePillWidth() {
      const marginAdjustment = 40; // New margin-left of insights
      const ringWidth = 80; // Width of the animation ring
      const paddingAdjustment = 20; // Additional padding if needed
      this.totalPillWidth =
        this.calculateMaxInsightWidth() +
        marginAdjustment +
        ringWidth +
        paddingAdjustment;
    },
    simulateTyping(message, callback) {
      let index = 0;
      const minSpeed = 50; // Minimum milliseconds between updates
      const maxSpeed = 100; // Maximum milliseconds between updates
      const shortPause = 800; // Short pause duration (in milliseconds)
      const longPause = 1800; // Long pause duration (in milliseconds)
      const minSentenceLengthForPause = 15; // Minimum sentence length to trigger a long pause
      const keyPauseWords = [
        "therefore",
        "however",
        "because",
        "thus",
        "but",
        // "and",
        "?",
      ]; // Words that suggest a pause

      // Add the 'typing' class to the message
      const messageElement = this.chatMessages[this.chatMessages.length - 1];
      messageElement.typing = true;

      const typeNextChunk = () => {
        const remainingText = message.substring(index);
        let chunkSize = Math.min(
          Math.floor(Math.random() * 3) + 2,
          remainingText.length
        ); // Randomize chunk size
        let nextChunk = remainingText.substring(0, chunkSize);

        const periodIndex = nextChunk.indexOf(".");
        const keyWordPause = keyPauseWords.some((word) =>
          nextChunk.includes(word)
        );
        const sentenceLength = messageElement.content.split(" ").length;

        if (periodIndex !== -1 && periodIndex < chunkSize - 1) {
          // Adjust chunk size to stop at the period
          chunkSize = periodIndex + 1;
          nextChunk = remainingText.substring(0, chunkSize);
        }

        messageElement.content += nextChunk;
        index += chunkSize;

        // Scroll to the bottom of the container during each chunk addition
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          container.scrollTop = container.scrollHeight;
        });

        if (index < message.length) {
          let delay;

          if (nextChunk.includes(".") || keyWordPause) {
            // Selective pausing: Only pause long sentences or after key phrases
            if (sentenceLength >= minSentenceLengthForPause || keyWordPause) {
              delay = longPause; // Longer pause for longer sentences or key phrases
            } else {
              delay = shortPause; // Short pause for shorter sentences
            }
          } else {
            delay = Math.random() * (maxSpeed - minSpeed) + minSpeed;
          }

          setTimeout(typeNextChunk, delay);
        } else {
          // Remove the 'typing' class after typing is complete
          messageElement.typing = false;
          if (callback) {
            callback(); // Execute callback after typing is complete
          }
        }
      };

      typeNextChunk(); // Start typing
    },
    setProgress(circle, percent) {
      const radius = circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;

      circle.style.strokeDasharray = `${circumference} ${circumference}`;

      // If it's the final segment, ensure the offset is exactly 0
      let offset = circumference - (percent / 100) * circumference;
      if (percent >= 99.9) {
        // Tweak this threshold as necessary
        offset = 0;
      }

      circle.style.strokeDashoffset = offset;
    },
    animateProgress(circle, insights) {
      const totalInsights = insights.length;
      const segment = 100 / totalInsights; // Calculate segment size
      const segmentDuration = 1500; // Duration for each segment (1.5 seconds)

      insights.forEach((insight, index) => {
        setTimeout(() => {
          this.currentInsight = insight;
          let progress = Math.min((index + 1) * segment, 100); // Calculate progress based on segment

          // Ensure that the last segment sets the progress to exactly 100%
          if (index === totalInsights - 1) {
            progress = 100;
          }

          this.setProgress(circle, progress); // Set progress for current segment
        }, index * segmentDuration); // Pause for 1.5 seconds between segments
      });
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
    // stopCyclingInsights() {
    //   if (this.intervalId) {
    //     clearInterval(this.intervalId);
    //     this.intervalId = null; // Ensure interval is cleared

    //     // Set the slide-out animation
    //     // this.pillAnimationClass = "slide-out";

    //     // Delay the slide-out animation
    //     // const slideOutDelay = 3000; // Delay before the slide-out starts (in milliseconds)

    //     // setTimeout(() => {
    //     //   // Set the slide-out animation
    //     //   this.pillAnimationClass = "slide-out";

    //     //   // Remove the pill message when the animation completes
    //     //   // setTimeout(() => {
    //     //   //   this.chatMessages = this.chatMessages.filter(
    //     //   //     (message) => message.type !== "pill"
    //     //   //   );
    //     //   // }, 1000); // Delay to match the slide-out animation duration
    //     // }, slideOutDelay);

    //     // Remove the pill message when the animation completes
    //     // this.chatMessages = this.chatMessages.filter(
    //     //   (message) => message.type !== "pill"
    //     // );
    //   }
    // },
    toggleLottieAnimation() {
      this.showLottieAnimation = !this.showLottieAnimation;
    },
    // startPillAnimation() {
    //   console.log("Starting pill animation"); // Debug log
    //   this.pillAnimationClass = "slide-in";
    //   this.showLottieAnimation = false; // Reset animation
    //   setTimeout(() => {
    //     this.startCyclingInsights(); // Start the cycle after sliding in
    //   }, 500); // Start cycling after the slide-in animation
    // },
    startPillAnimation(pillIndex) {
      console.log("Starting pill animation for pill:", pillIndex);
      const pillMessage = this.pillMessages[pillIndex];

      // Determine if this is the special pill message
      const isSpecialPillMessage = pillMessage.insights.includes(
        "Encountering issues with shipment provider..."
      );

      // Set the Lottie animation URL based on whether it's a special pill
      const lottieUrl = isSpecialPillMessage
        ? "https://lottie.host/d0178bee-39e1-4fe3-b235-18de7784f8d7/PzBoGqgmrh.json"
        : "https://lottie.host/1b945786-25bb-469c-9b7d-afd47c493091/AupOFJL7zQ.json";

      this.$nextTick(() => {
        setTimeout(() => {
          console.log("DOM updated, starting slide-in animation");
          pillMessage.animationClass = "slide-in";
          pillMessage.lottieUrl = lottieUrl;

          this.startCyclingInsights(pillIndex);

          // Delay until the insights have cycled and Lottie animation should start
          const insightsDuration = pillMessage.insights.length * 2000; // 2000ms per insight
          setTimeout(() => {
            pillMessage.animationClass = "completed"; // Mark the pill as completed

            pillMessage.showLottieAnimation = true; // Trigger the Lottie animation

            // After Lottie animation completes, transition to collapsed state
            const lottieAnimationDuration = 3000; // Assuming Lottie animation is 3 seconds long
            setTimeout(() => {
              pillMessage.animationClass = "collapsed"; // Transition to collapsed state
            }, lottieAnimationDuration);
          }, insightsDuration + 500); // Adjust the time to match the insight cycling duration
        }, 50);
      });
    },
    async sendMessage(isOption = false) {
      if (this.userMessage.trim() === "") return;

      // Push the userMessage to chatMessages if it's not coming from an option
      if (!isOption) {
        this.chatMessages.push({
          role: "user",
          content: this.userMessage,
          type: "text",
        });
      }

      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight; // Scroll to the bottom of the container after the user message
      });

      // Show the "thinking" indicator
      this.typingMessage = true;

      let userId = sessionStorage.getItem("userId");
      if (!userId) {
        userId = `user-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID
        sessionStorage.setItem("userId", userId);
      }

      try {
        const response = await axios.post("https://thesis-backend-vd4s.onrender.com/api/chat", {
          userId, // Send userId with the request
          message: this.userMessage,
          delay: this.responseDelay,
        });

        // Parse the order from the bot's response
        const parsedOrder = this.parseOrderFromResponse(response.data.reply);
        if (parsedOrder) {
          this.setCurrentOrder(parsedOrder);
          console.log(`Order detected and set: ${parsedOrder}`); // Debugging log
        } else {
          console.log("No order detected in the response");
        }

        // Check if the last assistant message referenced "Order C" and the user is trying to "Return"
        const lastAssistantMessage = this.chatMessages
          .slice()
          .reverse()
          .find((msg) => msg.role === "assistant" && msg.type === "text");

        const isReturningOrderC =
          lastAssistantMessage &&
          lastAssistantMessage.content.includes("Order C") &&
          this.userMessage.toLowerCase().includes("return");

        // Check if the user is attempting to return Order C
        if (isReturningOrderC) {
          this.showProgressBar = true;
          this.insights = [
            "Attempting to generate return label...",
            "Encountering issues with shipment provider...",
            "Escalating to human representative...",
          ];
        }
        // Determine if a progress bar and pill message should be shown
        else if (this.detectTrackingKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Verifying Order Details...",
            "Accessing Shipment Provider Database...",
            "Fetching Current Shipment Status...",
            "Operations Complete.",
            "Tracking Pill",
          ];
        } else if (
          response.data.reply.includes("Customer number") ||
          this.userMessage.match(/^\d+$/)
        ) {
          this.showProgressBar = true;
          this.insights = [
            "Accessing Customer Database...",
            "Verifying Customer Identity...",
            "Retrieving Order History...",
            "Operation Complete",
            "Costumer Num Pill",
          ];
        } else if (this.detectAddress(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Validating New Address...",
            "Updating Order Details...",
            "Notifying Delivery Service Provider...",
            "Recalculating Delivery Time...",
            "Mod Addy Pill",
          ];
        } else if (this.detectCancelKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Verifying Order Status...",
            "Checking Cancellation Policy...",
            "Cancel Pill",
          ];
        } else if (this.detectReturnKeywords(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Checking Return Policy...",
            "Verifying Product Eligibility...",
            "Return Pill",
          ];
        } else if (this.detectGiftMessage(this.userMessage)) {
          this.showProgressBar = true;
          this.insights = [
            "Adding Gift Message...",
            "Updating Order Details...",
            "Gift Pill",
          ];
        } else {
          this.showProgressBar = false;
        }

        // Delay for the "thinking" indicator
        setTimeout(() => {
          this.typingMessage = false; // Remove the "thinking" indicator after delay

          if (this.showProgressBar) {
            const newPillMessage = {
              insights: [...this.insights],
              currentInsight: this.insights[0],
              insightIndex: 0,
              showLottieAnimation: false,
              progress: 0,
              animationClass: "", // Initialize animation class
            };
            this.pillMessages.push(newPillMessage);

            this.chatMessages.push({
              role: "assistant",
              type: "pill",
              pillIndex: this.pillMessages.length - 1,
            });

            this.startPillAnimation(this.pillMessages.length - 1);

            // Ensure the DOM updates are completed before scrolling
            this.$nextTick(() => {
              const container = this.$refs.messagesContainer;
              container.scrollTop = container.scrollHeight; // Scroll to the bottom of the container

              const circle = this.$el.querySelector(".progress-ring__circle");
              this.setProgress(circle, 0); // Start at 0% (empty)
              this.animateProgress(circle, this.insights); // Start animation
            });

            const totalDuration = this.insights.length * 1500 + 500;

            setTimeout(() => {
              this.showProgressBar = false;

              // After the progress bar is done, type out the actual response
              this.chatMessages.push({
                role: "assistant",
                content: "",
                type: "text",
              });
              // Simulate typing and render options after completion
              this.simulateTyping(response.data.reply, () => {
                this.updateOptions(response.data.options || []);
                this.currentOptions = response.data.options || [];

                this.$nextTick(() => {
                  const container = this.$refs.messagesContainer;
                  container.scrollTop = container.scrollHeight;
                });
              });
            }, totalDuration);
          } else {
            // For normal messages (no progress bar)
            this.chatMessages.push({
              role: "assistant",
              content: "",
              type: "text",
            });
            // Simulate typing and render options after completion
            this.simulateTyping(response.data.reply, () => {
              this.updateOptions(response.data.options || []);
              this.currentOptions = response.data.options || [];

              this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                container.scrollTop = container.scrollHeight;
              });
            });
          }
        }, 2000); // 2 seconds delay for the "thinking" indicator
      } catch (error) {
        console.error("Error sending message:", error);
        this.typingMessage = false; // Clear the typing indicator in case of error
        this.chatMessages.push({
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          type: "text",
        });
      }
      this.userMessage = ""; // Clear the user message input after sending
    },
    // Modified sendOption method
    sendOption(option) {
      const fullUserMessage = this.getFullUserMessage(option);

      // Display the full-length message in the chat
      this.chatMessages.push({
        role: "user",
        content: fullUserMessage,
        type: "text",
      });

      // Set the short form input and call sendMessage with isOption=true
      this.userMessage = option;
      this.sendMessage(true);
    },
    handleUserInput() {
      // This method is triggered by the input field's send button or enter key
      this.sendMessage(false); // false indicates this is not an option
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
  width: 100vw; /* Set width to full viewport width */
  height: 100vh; /* Set height to full viewport height */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Ensures space distribution */
  align-items: center;
  overflow: auto;
}

:root {
  --shared-width: 1400px; /* Define a shared width variable */
}

.messages {
  width: var(--shared-width); /* Use the shared width variable */
  height: 500px; /* Increased height */
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 15px; /* Increased padding for better text alignment */
  border-radius: 40px; /* Rounded corners */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Optional: add shadow for depth */
  background-color: #f9f9f9; /* Optional: change background color for contrast */
  flex-grow: 1; /* Allows this box to grow to fill available space */
  display: flex;
  flex-direction: column;
  align-items: stretch; /* Stretches to use the full width available */
  margin-top: 30px; /* Margin at the top */
  background-color: #e6e6e6;
  position: relative; /* Set relative positioning for sliding */
  overflow-x: hidden; /* Add this to hide any horizontal overflow */
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
  margin-left: 40px; /* Add margin to push content right */

  transition: max-width 2s ease-in-out, opacity 2s ease-in-out;
  max-width: 100%; /* Default max-width to allow full text display */
}

.pill-message.slide-in {
  transform: translateX(0px); /* Slide into view */
}

.pill-message {
  overflow: visible;
  transition: transform 0.5s ease-in-out;
  transform: translateX(-700px); /* Start off-screen to the left */
  background-color: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  margin-bottom: 10px; /* Add space between messages */
}

.progress-pill {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: white; /* Pill remains white */
  border-radius: 50px;
  padding: 5px 10px;
  margin: 5px 0;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
  transition: width 2s ease-in-out; /* Smooth transition for collapsing */
  width: 100%; /* Start with full width */
}

.pill-message.completed {
  transform: none; /* Reset any transforms */
  background-color: #fff;
  padding: 10px 20px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  position: relative; /* Ensure it's part of the flow */
  margin-bottom: 10px;
}

.pill-message.collapsed {
  transform: translateX(-440px);
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
  align-self: flex-end; /* Align user messages to the right */
  background-color: #c0cfd1;
  color: black;
  margin-left: auto; /* Pushes the bubble to the right */
  margin-right: 10px; /* Margin from the right edge */
  text-align: right;
}

.user::after {
  content: "";
  position: absolute;
  top: 10px;
  right: -20px; /* Adjust this value to move the tail right or left */
  width: 0;
  height: 0;
  border: 30px solid transparent; /* Adjust size of the triangle */
  border-left-color: #c0cfd1; /* Same as the bubble background */
  border-right: none;
  border-top: none;
}

.assistant {
  align-self: flex-start; /* Align assistant messages to the left */
  background-color: #141e22;
  color: white;
  margin-left: 10px; /* Margin from the left edge */
  text-align: left;
  max-width: 70%; /* Reduce from 80% to 60% or your preferred value */
}

.assistant::before {
  content: "";
  position: absolute;
  top: 10px;
  left: -20px; /* Adjust this value to move the tail right or left */
  width: 0;
  height: 0;
  border: 30px solid transparent; /* Adjust size of the triangle */
  border-right-color: #141e22; /* Same as the bubble background */
  border-left: none;
  border-top: none;
}

/* Adjust tail position specifically for the thinking indicator */
.message.assistant.typing-indicator::before {
  top: 5px; /* Move the tail up for thinking indicators */
}

/* Applying the class to the typing indicator */
.message.assistant.typing-indicator {
  position: relative;
}

/* Remove tail for pill messages */
.pill-message::before {
  content: none; /* Remove the pseudo-element content */
}

.input-options {
  width: 80%; /* ensures input options take the full width */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-field-container {
  display: flex;
  width: 800px; /* Take the full width of the input-options container */
  align-items: center; /* Aligns children vertically in the center */
  border-radius: 50px;
  border: 1px solid #ccc;
  background-color: #c0cfd1;
  overflow: hidden;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  height: 60px; /* Set a fixed height for the container */
  margin-bottom: 20px;
}

.input-options input {
  width: calc(100% - 100px);
  flex-grow: 1; /* Makes the input field take all available space */
  height: 50px; /* Height of the input field */
  border: none; /* Remove border */
  background-color: transparent; /* Make background transparent */
  color: black; /* Text color */
  padding-left: 50px;
  outline: none; /* Remove outline on focus */
  font-size: 16px;
}

.send-button {
  margin-right: 10px;
  background-color: #dcf34f;
  color: black;
  border: none;
  width: 100px; /* Increase width for pill shape */
  height: 50px; /* Set a smaller height for pill shape */
  border-radius: 25px; /* Adjust border-radius for pill shape */
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
  top: 50px; /* Start 50px below the final position */
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
  transform: translateY(3px); /* Hover effect using translateY */
  box-shadow: 0 6px 12px rgba(220, 243, 79, 0.5);
}

button:active {
  background-color: #b4bf4f;
  color: white;
  transform: translateY(1px);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 243, 79, 0.75);
}

.grayed-out {
  background-color: #ddd; /* Gray background for grayed out */
  color: #666; /* Darker text color */
}

.animation-container {
  margin-left: auto; /* Align the animation to the right edge of the pill */
  position: relative; /* Use relative positioning for container */
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute; /* Position it absolutely within the container */
  top: 0;
  left: 0;
  width: 80px; /* Set the width to match the container */
  height: 80px; /* Set the height to match the container */
  transform: rotate(-90deg);
}

.progress-ring__circle {
  stroke: #dcf34f;
  stroke-width: 3.5;
  fill: transparent;
  stroke-dasharray: 163.36; /* For r=26, circumference is 2 * PI * 26 */
  stroke-dashoffset: 163.36; /* Start with the circle empty */
  transition: stroke-dashoffset 1.5s linear; /* Smooth transition for filling */
}

.lottie-container {
  margin-top: 10px;
}

/* Custom scrollbar for WebKit browsers */
.messages::-webkit-scrollbar {
  width: 8px; /* Scrollbar width */
}

.messages::-webkit-scrollbar-track {
  background: #f1f1f1; /* Track color */
}

.messages::-webkit-scrollbar-thumb {
  background: #888; /* Thumb color */
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #555; /* Thumb hover color */
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
  border-radius: 50%; /* Make the dots circular */
  display: inline-block;
  height: 8px; /* Adjust size as needed */
  margin-right: 4px; /* Space between dots */
  width: 8px; /* Adjust size as needed */
  animation: mercuryTypingAnimation 1.5s infinite ease-in-out; /* Ensure animation applies */
}

@keyframes mercuryTypingAnimation {
  0% {
    transform: translateY(0px);
  }
  28% {
    transform: translateY(
      -5px
    ); /* Adjust this value to control the bounce height */
  }
  44% {
    transform: translateY(0px);
  }
}

.tidot:nth-child(1) {
  animation-delay: 0s;
}
.tidot:nth-child(2) {
  animation-delay: 0.15s; /* Slight delay for the second dot */
}
.tidot:nth-child(3) {
  animation-delay: 0.3s; /* Slight delay for the third dot */
}

.message.assistant.typing::after {
  content: "_";
  display: inline-block;
  width: 1px;
  background-color: #000; /* Adjust the color to match your design */
  animation: blink 1s step-end infinite;
  margin-left: 2px; /* Optional: space between the text and the cursor */
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
</style>
