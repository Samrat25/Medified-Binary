/**
 * Zego Cloud API Configuration
 * 
 * Important: Replace these values with your actual Zego Cloud credentials
 * You can get these from your Zego Cloud dashboard after signing up at:
 * https://console.zegocloud.com/
 */

const ZEGO_CONFIG = {
    // Your Zego Cloud App ID (number)
    appID: 801785312,
    
    // Your Zego Cloud App Sign (string)
    // This is used for authentication and security
    appSign: "1253f267dec22bc5460bc77ed5d5096dd3870251690a0cb251f6f7c8d6d79884",
    
    // Server address - use the default unless specified otherwise by Zego
    server: 'wss://webliveroom801785312-api.coolzcloud.com/ws',
    
    // Log level (options: 'debug', 'info', 'warn', 'error', 'report', 'disable')
    logLevel: 'error'
};

// Export the configuration for use in other files
if (typeof module !== 'undefined') {
    module.exports = ZEGO_CONFIG;
}
