/**
 * Help Content
 * This file contains the help text for various parts of the app.
 * You can edit this file to update the content in the app.
 */

export const DEEPGRAM_HELP = `
<div class="help-content-wrapper">
    <h3><i class="fas fa-key"></i> Getting a Deepgram API Key</h3>
    
    <div class="help-steps">
        <div class="help-step">
            <div class="step-icon"><i class="fas fa-user-plus"></i></div>
            <div class="step-content">
                <strong>1. Sign Up</strong>
                <p>Register at <a href="https://console.deepgram.com/signup" target="_blank">console.deepgram.com</a></p>
            </div>
        </div>

        <div class="help-step">
            <div class="step-icon"><i class="fas fa-plus-circle"></i></div>
            <div class="step-content">
                <strong>2. Create API Key</strong>
                <p>Click <strong>"Create API Key"</strong> in the dashboard sidebar.</p>
            </div>
        </div>

        <div class="help-step">
            <div class="step-icon"><i class="fas fa-copy"></i></div>
            <div class="step-content">
                <strong>3. Copy & Use</strong>
                <p>Copy the key and paste it into the Settings page of this app.</p>
            </div>
        </div>
    </div>

    <div class="help-note">
        <i class="fas fa-info-circle"></i> Deepgram provides free credits for a large amount of transcription.
    </div>

    <div class="help-details">
        <p>This key allows the app to convert spoken words in sermons into text. Your key is stored only on your device.</p>
    </div>
</div>
`;

export const OPENAI_HELP = `
<div class="help-content-wrapper">
    <h3><i class="fas fa-key"></i> Getting an OpenAI API Key</h3>
    
    <div class="help-steps">
        <div class="help-step">
            <div class="step-icon"><i class="fas fa-user-plus"></i></div>
            <div class="step-content">
                <strong>1. Sign Up / Log In</strong>
                <p>Go to <a href="https://platform.openai.com/signup" target="_blank">platform.openai.com</a></p>
            </div>
        </div>

        <div class="help-step">
            <div class="step-icon"><i class="fas fa-folder-open"></i></div>
            <div class="step-content">
                <strong>2. Create Project</strong>
                <p>Go to <strong>Projects</strong>, create a new one (e.g., "Sermon App"), and select it.</p>
            </div>
        </div>

        <div class="help-step">
            <div class="step-icon"><i class="fas fa-plus-circle"></i></div>
            <div class="step-content">
                <strong>3. Create API Key</strong>
                <p>Go to <strong>API Keys</strong> in the menu and click <strong>"Create new secret key"</strong>.</p>
            </div>
        </div>
    </div>

    <div class="help-note">
        <i class="fas fa-exclamation-triangle"></i> You must have billing set up on your OpenAI account for the key to work.
    </div>

    <div class="help-details">
        <p>This key allows the app to enhance the readability of transcripts. Your key is stored securely on your device and sent directly to OpenAI.</p>
    </div>
</div>
`;
