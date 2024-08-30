<template>
  <div class="pill-test-container">
    <!-- Progress Pill with Ring -->
    <div
      class="progress-pill"
      :style="{ width: `${totalPillWidth}px` }"
      :class="pillAnimationClass"
    >
      <div class="insights">
        {{ currentInsight }}
      </div>
      <div class="animation-container">
        <svg
          v-if="!showLottieAnimation"
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
          />
        </svg>

        <!-- Lottie Animation -->
        <lottie-player
          v-if="showLottieAnimation"
          class="lottie-small"
          src="https://lottie.host/9f981a4d-aad2-4385-bd15-11a509e12a0b/toYfrYD1pE.json"
          background="transparent"
          speed="1"
          style="width: 80px; height: 80px"
          autoplay
          direction="1"
          mode="normal"
        ></lottie-player>
      </div>
    </div>

    <!-- Toggle Lottie Animation Button -->
    <button @click="startPillAnimation">Start Animation</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      insights: [
        "Testing Insight...",
        "A longer insight for testing purposes...",
        "The longest insight example in the list for sizing...",
      ],
      currentInsight: "Testing Insight...",
      maxInsightWidth: 0,
      totalPillWidth: 0,
      showLottieAnimation: false, // Control visibility of the Lottie animation
      insightIndex: 0, // Track the current index of insights
      intervalId: null, // Store the interval ID for cleanup
      pillAnimationClass: "", // Control the animation class
    };
  },
  mounted() {
    this.calculateMaxInsightWidth();
  },
  beforeUnmount() {
    this.stopCyclingInsights();
  },
  methods: {
    calculateMaxInsightWidth() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "italic 20px Arial"; // Match the font style in CSS

      let maxWidth = 0;
      this.insights.forEach((insight) => {
        const width = context.measureText(insight).width;
        if (width > maxWidth) maxWidth = width;
      });
      this.maxInsightWidth = maxWidth;
      this.totalPillWidth = this.maxInsightWidth + 250; // Adjust for padding, ring, and left extension
    },
    startCyclingInsights() {
      this.insightIndex = 0; // Reset index for cycling
      this.intervalId = setInterval(() => {
        this.insightIndex = (this.insightIndex + 1) % this.insights.length;
        this.currentInsight = this.insights[this.insightIndex];

        // Automatically switch to Lottie animation when progress is complete
        if (this.insightIndex === this.insights.length - 1) {
          this.toggleLottieAnimation();
        }
      }, 2000); // Cycle every 2 seconds

      // Set timeout to slide out the pill after animation cycle
      setTimeout(() => {
        this.stopCyclingInsights();
        this.pillAnimationClass = "slide-out";
      }, this.insights.length * 2000 + 1000); // Total time + additional time for animation
    },
    stopCyclingInsights() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    },
    toggleLottieAnimation() {
      this.showLottieAnimation = !this.showLottieAnimation;
    },
    startPillAnimation() {
      this.pillAnimationClass = "slide-in";
      this.showLottieAnimation = false; // Reset animation
      setTimeout(() => {
        this.startCyclingInsights(); // Start the cycle after sliding in
      }, 500); // Start cycling after the slide-in animation
    },
  },
};
</script>

<style scoped>
.pill-test-container {
  margin: 20px; /* Add margin for separation */
  overflow: hidden; /* Ensure the pill can slide in and out smoothly */
  position: absolute; /* Position relative to container */
  width: 100%; /* Full width for sliding effect */
  border: 5px solod green;
}

.progress-pill {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.1); /* Transparent background */
  border-radius: 50px;
  padding: 10px 20px;
  margin: 10px 0;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); /* Light shadow */
  backdrop-filter: blur(10px); /* Frosted glass effect */
  border: 1px solid rgba(255, 255, 255, 0.18); /* Light border for glass edge */
  position: absolute;
  left: -100px; /* Start off-screen to the left */
  transition: transform 0.5s ease-in-out;
}

.slide-in {
  transform: translateX(500px); /* Slide into view */
}

.insights {
  font-style: italic;
  font-size: 20px;
  color: #fff; /* White text for contrast */
  display: inline-block;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  margin-left: 100px; /* Add margin to push content right */
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
  transform: rotate(270deg);
}

.progress-ring__circle {
  stroke: #007bff;
  stroke-width: 3.5;
  fill: transparent;
  stroke-dasharray: 201.06; /* Full circumference for r=32 */
  stroke-dashoffset: 0; /* Fully filled by default */
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
