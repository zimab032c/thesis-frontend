<template>
    <div class="landing-page">
      <h1>Welcome to the Customer Support Chatbot</h1>
      <p>Click the button below to start the interaction.</p>
      <button @click="startChat">Start Chat</button>
    </div>
  </template>
  
  <script>
  export default {
    methods: {
      startChat() {
        this.$router.push('/chat'); // Navigate to the chat route
      }
    }
  }
  </script>
  
  <style scoped>
  .landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    background-color: #f4f4f4;
  }
  
  .landing-page h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .landing-page p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
  }
  
  .landing-page button {
    padding: 1rem 2rem;
    font-size: 1.25rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .landing-page button:hover {
    background-color: #0056b3;
  }
  </style>
  