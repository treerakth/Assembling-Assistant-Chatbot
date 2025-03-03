const { OpenAI } = require("llamaindex");
const logger = require('./logbackup.js'); // Import the logger

async function summarizeResponse(responseText, calculated) {
    const llm = new OpenAI({
        model: "gpt-4o-mini",
        additionalChatOptions: { response_format: { type: "json_object" } },
    });

    const example = {
        summary: "",
    };

    const response = await llm.chat({
        messages: [
            {
                role: "system",
                content: `
                        1. Review the provided response text for any vague or unclear information. 
                        If you find phrases like "Price not fully provided" or "not found", clarify these statements to ensure the message is easily understood by the user.
                
                        2. If any Set PC has incomplete hardware data or vague information, exclude that entire Set PC from the final response.
                
                        3. If the response mentions suitable or recommended multiple PC or hardware, do not specify how many sets are provided. Use the phrase "Recommended sets:" instead.
                
                        4. Remove any mention of the phrases "Estimated Price", "Approximate", "Not provided," or "Not specified" from the response, and remove the price mention after these phrases.
                
                        5. Regarding mentions of "Total Price":
                        - If ${calculated} equals 0, do not change anything regarding the price in the response.
                        - If ${calculated} is greater than 0 and there are more than 5 hardware items:
                            - Check if the current Total Price in the response matches ${calculated}.
                            - If it does not match, and if the response contains "Approximate" or "Approx", replace "Total Price" in the response with "Total Price: ฿${calculated}".
                            - Format all prices consistently as "฿XX,XXX".
                
                        6. At the end of the response, add three random emojis that are relevant to the context.
                
                        7. If the response text indicates that assistance is limited to PC-related topics or similar (e.g., "I'm sorry, but I can only assist with PC-related topics."), respond with the original message and add emojis as per point 6.
                
                        8. Return the response in a readable format:
                        - If there are headings or numbered lists (e.g., 1., 2., 3.), each should be on a new line.
                        - Add a blank line before each heading or number for better separation.
                        - Remove asterisks (*) used for emphasis, as the response will be sent as a Line message where bold text is not possible.
                
                        9. Return the response in JSON format using the structure provided below:\n\n${JSON.stringify(example)}`,
            },
            {
                role: "user",
                content: `Here is the response text: \n------\n${responseText}\n------`,
            },
        ],
    });

    const text = JSON.parse(response.message.content).summary;
    logger.info("________________________________________");
    logger.info(`Response summarized: ${text}`);
    return `${text}`;
}

module.exports = { summarizeResponse };
