// ... (keep all existing code)

// Add this new code at the end of the file

// Object to store conversations
let conversations = {};

// Function to add a message to a conversation
function addMessageToConversation(phoneNumber, message, isIncoming) {
    if (!conversations[phoneNumber]) {
        conversations[phoneNumber] = [];
    }
    conversations[phoneNumber].push({
        timestamp: new Date().toISOString(),
        message: message,
        isIncoming: isIncoming
    });
}

// Modify the sendButton event listener to include message tracking
sendButton.addEventListener('click', async () => {
    if (!twilioClient) {
        showNotification('Please set up Twilio credentials first.');
        return;
    }

    const contact = contacts[currentContactIndex];
    const message = generateMessage();
    const phoneNumber = contact[1];

    try {
        // Send SMS via Twilio
        await sendTwilioMessage(
            twilioClient, 
            phoneNumber, 
            document.getElementById('twilioNumber').value, 
            message, 
            selectedImage
        );

        // Add outgoing message to conversation
        addMessageToConversation(phoneNumber, message, false);

        // Send survey invite via Voxco
        await sendVoxcoSurveyInvite(
            voxcoApiKey,
            voxcoSurveyId,
            contact[0], // Assuming the first column is the respondent ID
            phoneNumber
        );

        showNotification('Message sent successfully!');
        currentContactIndex++;
        if (currentContactIndex >= contacts.length) {
            showNotification('All contacts processed!');
            dispatchModal.style.display = "none";
        } else {
            updateDispatchModal();
        }
    } catch (error) {
        showNotification('Error sending message. Please try again.');
        console.error('Error:', error);
    }
});

// Modify the updateDispatchModal function to display conversation history
function updateDispatchModal() {
    const contact = contacts[currentContactIndex];
    const phoneNumber = contact[1];
    contactInfo.innerHTML = `<h3>Contact Information:</h3>
        <p>Name: ${contact[0]}</p>
        <p>Phone: ${phoneNumber}</p>
        <p>Email: ${contact[2]}</p>`;
    
    conversation.innerHTML = '<h3>Conversation History:</h3>';
    if (conversations[phoneNumber] && conversations[phoneNumber].length > 0) {
        conversations[phoneNumber].forEach(msg => {
            conversation.innerHTML += `
                <p class="${msg.isIncoming ? 'incoming' : 'outgoing'}">
                    <strong>${msg.isIncoming ? 'Incoming' : 'Outgoing'}:</strong> ${msg.message}
                    <br><small>${new Date(msg.timestamp).toLocaleString()}</small>
                </p>
            `;
        });
    } else {
        conversation.innerHTML += '<p>No previous messages.</p>';
    }
    
    const message = generateMessage();
    dispatchPreview.textContent = message;

    if (selectedImage) {
        dispatchImagePreview.src = selectedImage;
        dispatchImagePreview.style.display = 'block';
    } else {
        dispatchImagePreview.style.display = 'none';
    }
}

// Function to fetch incoming messages from the server
async function fetchIncomingMessages() {
    try {
        const response = await fetch('/incoming-messages');
        const incomingMessages = await response.json();
        incomingMessages.forEach(msg => {
            addMessageToConversation(msg.from, msg.body, true);
        });
        updateDispatchModal();
    } catch (error) {
        console.error('Error fetching incoming messages:', error);
    }
}

// Fetch incoming messages every 30 seconds
setInterval(fetchIncomingMessages, 30000);

// Initial fetch of incoming messages
fetchIncomingMessages();
