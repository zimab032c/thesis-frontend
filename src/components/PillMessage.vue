<template>
  <div class="progress-pill" :class="animationClass">
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
          :style="{ strokeDashoffset: strokeOffset }"
        />
      </svg>
      <lottie-player
        v-if="showLottieAnimation"
        class="lottie-small"
        src="https://lottie.host/1b945786-25bb-469c-9b7d-afd47c493091/AupOFJL7zQ.json"
        background="transparent"
        speed="1"
        style="width: 80px; height: 80px"
        autoplay
        direction="1"
        mode="normal"
      ></lottie-player>
    </div>
  </div>
</template>

<script>
export default {
  props: ["insights"],
  data() {
    return {
      currentInsight: "",
      insightIndex: 0,
      showLottieAnimation: false,
      animationClass: "",
      intervalId: null,
      strokeOffset: 163.36, // Initial stroke offset for progress ring
    };
  },
  mounted() {
    this.startAnimation();
  },
  methods: {
    startAnimation() {
      this.animationClass = "slide-in";
      this.cycleInsights();
    },
    cycleInsights() {
      const totalInsights = this.insights.length;
      const segmentDuration = 1500; // Duration for each insight
      const segment = 100 / totalInsights; // Calculate segment size

      const cycleThroughInsights = () => {
        if (this.insightIndex < totalInsights) {
          this.currentInsight = this.insights[this.insightIndex];
          const progress = (this.insightIndex + 1) * segment; // Calculate progress based on segment
          this.strokeOffset = 163.36 - (progress / 100) * 163.36; // Calculate stroke offset
          this.insightIndex++;

          if (this.insightIndex === totalInsights) {
            this.showLottieAnimation = true;
            this.stopCycling();
          }
        }
      };

      this.intervalId = setInterval(cycleThroughInsights, segmentDuration);
      cycleThroughInsights(); // Start immediately
    },
    stopCycling() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
  beforeUnmount() {
    this.stopCycling();
  },
};
</script>

<style scoped>
.progress-pill {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: white;
  border-radius: 50px;
  padding: 5px 10px;
  margin: 5px 0;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.5s ease-in-out;
  transform: translateX(-700px); /* Start off-screen */
}

.slide-in {
  transform: translateX(0px); /* Slide into view */
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
  transition: stroke-dashoffset 1.5s linear; /* Smooth transition for filling */
}

.lottie-container {
  margin-top: 10px;
}
</style>
