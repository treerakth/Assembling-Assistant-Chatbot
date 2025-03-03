const { OpenAI } = require("llamaindex");
const fs = require("fs").promises;
const fsPromises = require("fs").promises;
const { Document, VectorStoreIndex, QueryEngineTool, OpenAIAgent, Settings, storageContextFromDefaults } = require("llamaindex");
const logger = require('./logbackup.js'); // Import the logger
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
let Query_Detect = 'no mention';

//Create index and Tool function
async function ToolsTypePC(Type_PC, description) {
    const index = {};
    for (const TypePC of Type_PC) {
        const secondStorageContext = await storageContextFromDefaults({
            persistDir: `./storage/Type_PC/${TypePC}`,
        });
        const curIndex = await VectorStoreIndex.init({
            storageContext: secondStorageContext,
        });
        index[TypePC] = curIndex;
    }

    return Type_PC.map(TypePC => {
        return new QueryEngineTool({
            queryEngine: index[TypePC].asQueryEngine(),
            metadata: {
                name: `index_${TypePC}`,
                description: description(TypePC),
            },
        });
    });
}

async function ToolsHardwares(Hardwares, description) {
    const index = {};
    for (const Hardware of Hardwares) {
        const secondStorageContext = await storageContextFromDefaults({
            persistDir: `./storage/Hardware/${Hardware}`,
        });
        const curIndex = await VectorStoreIndex.init({
            storageContext: secondStorageContext,
        });
        index[Hardware] = curIndex;
    }

    return Hardwares.map(Hardware => {
        return new QueryEngineTool({
            queryEngine: index[Hardware].asQueryEngine(),
            metadata: {
                name: `index_${Hardware}`,
                description: description(Hardware),
            },
        });
    });
}
async function ToolsHardware_Case(Cases, description) {
    const index = {};
    for (const Case of Cases) {
        const secondStorageContext = await storageContextFromDefaults({
            persistDir: `./storage/Hardware/Case/${Case}`,
        });
        const curIndex = await VectorStoreIndex.init({
            storageContext: secondStorageContext,
        });
        index[Case] = curIndex;
    }

    return Cases.map(Case => {
        return new QueryEngineTool({
            queryEngine: index[Case].asQueryEngine(),
            metadata: {
                name: `index_Case_${Case}`,
                description: description(Case),
            },
        });
    });
}
async function ToolsHardware_GPU(GPUs, description) {
    const index = {};
    for (const GPU of GPUs) {
        const secondStorageContext = await storageContextFromDefaults({
            persistDir: `./storage/Hardware/GPU/${GPU}`,
        });
        const curIndex = await VectorStoreIndex.init({
            storageContext: secondStorageContext,
        });
        index[GPU] = curIndex;
    }

    return GPUs.map(GPU => {
        return new QueryEngineTool({
            queryEngine: index[GPU].asQueryEngine(),
            metadata: {
                name: `index_GPU_${GPU}`,
                description: description(GPU),
            },
        });
    });
}
async function ToolsHardware_Motherboard(Motherboards, description) {
    const index = {};
    for (const Motherboard of Motherboards) {
        const secondStorageContext = await storageContextFromDefaults({
            persistDir: `./storage/Hardware/Motherboard/${Motherboard}`,
        });
        const curIndex = await VectorStoreIndex.init({
            storageContext: secondStorageContext,
        });
        index[Motherboard] = curIndex;
    }

    return Motherboards.map(Motherboard => {
        return new QueryEngineTool({
            queryEngine: index[Motherboard].asQueryEngine(),
            metadata: {
                name: `index_Motherboard_${Motherboard}`,
                description: description(Motherboard),
            },
        });
    });
}
// Function to create the General Tool
function GeneralTools() {
    return new QueryEngineTool({
        metadata: {
            name: "general_tool",
            description: `
            Use this tool to recommend PCs or hardware. Confirm the user's budget and specific PC type.
            Your "SC-Assistant" If the user sends a greeting, respond gently and warmly by introducing yourself and explaining your role.
            When discussing a PC type (e.g., Gaming, Premium, Standard, Works or Hardwares), switch to the appropriate tool for that category.
            If the query changes to a different PC type, ensure the tool is updated.
            For non-PC queries, explain that only PC-related topics are handled.
            When asked about available PC types:
            1. Confirm the specific PC type.
            2. Present PC types:
                1. **Gaming PC**: Focus on powerful GPUs.
                2. **Premium PC**: High-spec for advanced tasks.
                3. **Standard PC**: Balanced performance and cost.
                4. **Works PC**: Designed for graphics and professional tasks.
            Switch tools as needed for category changes.
            `,
        },
    });
}
async function initializeAgent() {
    try {
        Settings.llm = new OpenAI({ model: "gpt-4o-mini" });
        Settings.callbackManager.on("llm-tool-call", (event) => {
            logger.info(`LLM Tool Call: ${JSON.stringify(event.detail.payload)}`);
            tool_name = event.detail.payload.toolCall.name;
        });
        const Type_PC = ['Gaming', 'Premium', 'Standard', 'Works']
        const Hardwares = ['CPU', 'Cooler', 'Harddisk', 'PSU', 'RAM', 'SSD']
        const Cases = ['AEROCOOL', 'ANTEC', 'APNX', 'ASUS', 'BE_QUIET', 'COOLER_MASTER', 'CORSAIR', 'COUGAR', 'DARKFLASH', 'DEEPCOOL', 'EKONTA', 'GALAX', 'GAMDIAS', 'GIGABYTE', 'HYTE', 'INWIN', 'LIAN', 'MONTECH', 'MSI', 'NZXT', 'OCPC', 'PLENTY', 'SAMA', 'SILVERSTONE', 'THERMALTAKE', 'ZALMAN']
        const GPUs = ['AMD', 'ASROCK', 'ASUS', 'GALAX', 'GIGABYTE', 'INNO3D', 'LEADTEK', 'MSI', 'PNY', 'POWER_COLOR', 'SAPPHIRE', 'SPARKLE', 'ZOTAC']
        const Motherboards = ['ASROCK', 'ASUS_PRIME', 'ASUS_PROART', 'ASUS_ROG', 'ASUS_TUF', 'GIGABYTE', 'MSI', 'NZXT']

        const TypeGaming_Description = (TypePC) => `
        Use the tool "index_${TypePC}" to search for assembled Gaming PCs with a budget range of 12,000 - 50,000 baht.
        Ensure you understand the user's needs before changing the tool. 
        Check thoroughly for all available options and confirm if any suitable sets are found.
        Provide example questions to clarify their request, such as:
        - "What gaming PC do you recommend?"
        If the user chooses a PC set, format the response as follows:
        1. Show the **NAME of the PC SET** first.
        2. Detail the components in this order:
        - **Price**: (This price)
        - **Brand**: (This Brand)
        - **Etc.**: Important details for the user.
        If no options are found, inform the user and suggest alternatives such as increasing the budget or considering individual components.
        `;

        const TypeWorks_Description = (TypePC) => `
        Use the tool "index_${TypePC}" to search for assembled Works PCs with a budget range of 30,000 - 120,000 baht.
        Ensure you understand the user's needs before changing the tool.
        Check thoroughly for all available options and confirm if any suitable sets are found.
        Provide example questions to clarify their request, such as:
        - "What works PC do you recommend?"
        If the user chooses a PC set, format the response as follows:
        1. Show the **NAME of the PC SET** first.
        2. Detail the components in this order:
        - **Price**: (This price)
        - **Brand**: (This Brand)
        - **Etc.**: Important details for the user.
        If no options are found, inform the user and suggest alternatives such as increasing the budget or considering individual components.
        `;

        const TypePremium_Description = (TypePC) => `
        Use the tool "index_${TypePC}" to search for assembled Premium PCs with a budget range of 160,000 - 210,000 baht.
        Ensure you understand the user's needs before changing the tool.
        Check thoroughly for all available options and confirm if any suitable sets are found.
        Provide example questions to clarify their request, such as:
        - "What premium PC do you recommend?"
        If the user chooses a PC set, format the response as follows:
        1. Show the **NAME of the PC SET** first.
        2. Detail the components in this order:
        - **Price**: (This price)
        - **Brand**: (This Brand)
        - **Etc.**: Important details for the user.
        If no options are found, inform the user and suggest alternatives such as increasing the budget or considering individual components.
        `;

        const TypeStandard_Description = (TypePC) => `
        Use the tool "index_${TypePC}" to search for assembled Standard PCs with a budget range of 8,000 - 20,000 baht.
        Ensure you understand the user's needs before changing the tool.
        Check thoroughly for all available options and confirm if any suitable sets are found.
        Provide example questions to clarify their request, such as:
        - "What standard PC do you recommend?"
        If the user chooses a PC set, format the response as follows:
        1. Show the **NAME of the PC SET** first.
        2. Detail the components in this order:
        - **Price**: (This price)
        - **Brand**: (This Brand)
        - **Etc.**: Important details for the user.
        If no options are found, inform the user and suggest alternatives such as increasing the budget or considering individual components.
        `;
        //Description Hardware
        const CPU_Description = (Hardware) => `
        Use "index_${Hardware}" to find CPU info. 
        Check motherboard compatibility (socket type, chipset) if not found. 
        Provide brand-specific recommendations (e.g., AMD, Intel).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const Cooler_Description = (Hardware) => `
        Use "index_${Hardware}" for CPU cooler info. 
        Check CPU compatibility (socket support) if not found. 
        Provide brand-specific recommendations (available in Thailand).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const Harddisk_Description = (Hardware) => `
        Use "index_${Hardware}" for hard disk info. 
        Check motherboard compatibility (interface, HHD, SATA) if not found.
        Provide brand-specific recommendations (available in Thailand).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const SSD_Description = (Hardware) => `
        Use "index_${Hardware}" for SSD info. 
        Check motherboard compatibility (interface, NVMe) if not found. 
        Provide brand-specific recommendations (available in Thailand).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const PSU_Description = (Hardware) => `
        Use "index_${Hardware}" for PSU info. 
        Check compatibility with motherboard, GPU, or case (pin types, form factor) if not found. 
        Provide brand-specific recommendations (available in Thailand).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const RAM_Description = (Hardware) => `
        Use "index_${Hardware}" for RAM info. 
        Check motherboard compatibility (supported DDR) if not found. 
        Provide brand-specific recommendations (available in Thailand).
        **Details Format**:
        - Brand: Name
        - Price: ฿XXXX
        - Etc.: Key details.
        `;
        const Case_Description = (Case) => `
        Use the "index_Case_${Case}" tool to search for cases.
        1. **Verification**: Ensure names and details are accurate.
        2. **Compatibility**: Make sure compatibility with the motherboard (eg. ATX,Micro-ATX,Mini-ATX and other).
        3. **Recommendations**: Provide details for brands available in Thailand.
        4. **Fallback Search**: If not found, check other cases in the same folder.
        **Query Matching**: Search using the exact name of the case.
        **Show Detail for Case Format**:
        - **Brand**: Brand Name
        - **Price**: ฿XXXX
        - **Etc.**: Important details for the user.
        `;
        const GPU_Description = (GPU) => `
        Use the "index_GPU_${GPU}" tool to search for GPUs.
        1. **Verification**: Ensure names and details are accurate.
        2. **Compatibility**: Make sure compatibility with the motherboard (eg. PCIe slots).
        3. **Recommendations**: Provide details for brands available in Thailand.
        4. **Fallback Search**: If not found, check other GPUs in the same folder.
        **Query Matching**: Search using the exact name of the GPU.
        **Show Detail for GPU Format**:
        - **Brand**: Brand Name
        - **Price**: ฿XXXX
        - **Etc.**: Important details for the user.
        `;
        const Motherboard_Description = (Motherboard) => `
        Use the "index_Motherboard_${Motherboard}" tool to search for motherboards.
        1. **Verification**: Ensure names and details are accurate.
        2. **Compatibility**: Make sure compatibility with the CPU (eg. AM4 Socket,LGA 1700 and other).
        3. **Recommendations**: Provide details for brands available in Thailand.
        4. **Fallback Search**: If not found, check other motherboards in the same folder.
        **Query Matching**: Search using the exact name of the motherboard.
        **Show Detail for Motherboard Format**:
        - **Brand**: Brand Name
        - **Price**: ฿XXXX
        - **Etc.**: Important details for the user.
        `;

        //Type PC
        const GamingType_Tool = await ToolsTypePC(Type_PC, TypeGaming_Description)
        const StandardType_Tool = await ToolsTypePC(Type_PC, TypeStandard_Description)
        const PremiumType_Tool = await ToolsTypePC(Type_PC, TypePremium_Description)
        const WorksType_Tool = await ToolsTypePC(Type_PC, TypeWorks_Description)
        //Hardware
        const CPU_HardwareTool = await ToolsHardwares(Hardwares, CPU_Description)
        const Cooler_HardwareTool = await ToolsHardwares(Hardwares, Cooler_Description)
        const PSU_HardwareTool = await ToolsHardwares(Hardwares, PSU_Description)
        const SSD_HardwareTool = await ToolsHardwares(Hardwares, SSD_Description)
        const RAM_HardwareTool = await ToolsHardwares(Hardwares, RAM_Description)
        const Harddisk_HardwareTool = await ToolsHardwares(Hardwares, Harddisk_Description)
        //Hardware have subfolders
        const Case_HardwareTool = await ToolsHardware_Case(Cases, Case_Description)
        const GPU_HardwareTool = await ToolsHardware_GPU(GPUs, GPU_Description)
        const Motherboard_HardwareTool = await ToolsHardware_Motherboard(Motherboards, Motherboard_Description)

        // Create the General Tool
        const generalTool = GeneralTools();

        // Combine all tools
        const Tools = [generalTool, ...GamingType_Tool, ...StandardType_Tool, ...PremiumType_Tool, ...WorksType_Tool, ...CPU_HardwareTool, ...Cooler_HardwareTool, ...PSU_HardwareTool, ...SSD_HardwareTool, ...RAM_HardwareTool, ...Harddisk_HardwareTool, ...Case_HardwareTool, ...GPU_HardwareTool, ...Motherboard_HardwareTool];

        const agent = new OpenAIAgent({
            tools: Tools,
            verbose: true,
        });

        logger.info('Agent Initialized');
        return agent;
    } catch (error) {
        logger.error("Error initializing agent: " + error);
        throw error;
    }
}

async function getResponse(agent, userInput) {
    try {
        if (!agent) {
            throw new Error("Agent is not defined");
        }

        const response = await agent.chat({
            message: userInput,
        });
        logger.info('------------------------------------------------------');
        logger.info("Response Agent: " + response.message.content);
        logger.info("Model: " + response.raw.model);
        logger.info('------------------------------------------------------');
        return response.message.content;
    } catch (error) {
        logger.error("Error getting response: " + error);
        throw error;
    }
}
module.exports = { initializeAgent, getResponse };
