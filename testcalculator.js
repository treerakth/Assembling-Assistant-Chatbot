const { OpenAI, Settings } = require("llamaindex");
const logger = require('./logbackup.js'); // Import the logger

async function calculator(responseText) {
    Settings.llm = new OpenAI({ model: "gpt-4o-mini" });
    const llm = new OpenAI({
        model: "gpt-4o-mini",
        additionalChatOptions: { response_format: { type: "json_object" } },
    });
    const example = {
        price: {
            CPU: 'price of CPU only number if not found set value is 0.',
            MBD: 'price of Motherboard',
            GPU: 'price of Graphic Card',
            PSU: 'price of Power Supply',
            RAM: 'price of RAM',
            STOR: 'price of Storage',
            CASE: 'price of Case',
            CLR: 'price of CPU Cooler'
        },
        check: ""//check respone text but dont have said no mention
    };
    const response = await llm.chat({
        messages: [
            {
                role: "system",
                content: `You will answer a total price from ${example}.\n\nGenerate a valid JSON in the following format:\n\n${JSON.stringify(
                    example,
                )}`,
            },
            {
                role: "user",
                content: `Here is respone text: \n------\n${responseText}\n------`,
            },
        ],
    });
    const text = await response.message.content;
    let obj;
    let totalPrice;
    try {
        obj = JSON.parse(text);

        // สร้าง Array ที่จะเก็บราคาทั้งหมด
        let prices = [];

        // ใช้ spread operator ในการอ้างอิงและเก็บค่าลง Array
        prices.push(...[
            { item: "CPU", price: obj.price.CPU },
            { item: "Motherboard", price: obj.price.MBD },
            { item: "GPU", price: obj.price.GPU },
            { item: "Power Supply", price: obj.price.PSU },
            { item: "RAM", price: obj.price.RAM },
            { item: "Storage", price: obj.price.STOR },
            { item: "Case", price: obj.price.CASE },
            { item: "Cooler", price: obj.price.CLR }
        ]);
        // แสดงผล Array ที่เก็บข้อมูล
        console.log("Prices Array: ", prices);
        totalPrice = prices.reduce((total, item) => total + item.price, 0);

    } catch (error) {
        logger.error("Error parsing JSON: " + error.message);
        console.log("Raw JSON received: ", text);
        logger.error("Raw JSON received: " + text);
        throw new Error("Failed to parse JSON");
    }

    console.log("Total Price: ", totalPrice);
    return totalPrice;
}
module.exports = { calculator };