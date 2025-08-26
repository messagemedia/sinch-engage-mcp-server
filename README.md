# Sinch Engage MCP Server

This repository contains the source code for the Sinch Engage (Sinch MessageMedia in AU) MCP server, which provides Sinch Engage APIs as MCP tools.

## Tools Overview

Here is the list of tools available in the MCP server (all the phone numbers must be provided in E.164 format, e.g., `+61400000000` for Australia).

### Messaging

| Tool                         | Description                                                                                                                                                                                                          | Category      | Mode       |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|------------|
| **sendMessage**             | Send SMS to a mobile number                                                                                                                                                                                           | messaging     | write      |


### Reporting

| Tool                                  | Description                                                                                                                                                                                          | Category      | Mode       |
|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|------------|
| **getDetailedMessageReport**          | Generates a detailed report of sent and received messages for a specified date range, with optional filters for direction, accounts, metadata, and grouping.                                         | reporting     | read       |
| **getSummaryMessageReport**           | Generates a summary report of sent and received messages for a specified date range, with optional filters for direction, accounts, and grouping.                                                    | reporting     | read       |
| **getSummaryInsightMessageReport**    | Fetches a pre-compiled summary report of sent and received messages for a specified date range, with optional filters for direction, accounts, and grouping.                                         | reporting     | read       |
| **getAsyncReportStatus**              | Retrieves the status of an asynchronous report request by report_id.                                                                                                                                 | reporting     | read       |
| **getAsyncReportFields**              | Retrieves the list of available fields for asynchronous detailed report export.                                                                                                                      | reporting     | read       |
| **requestAsyncDetailedMessageReport** | Requests an asynchronous detailed report of sent and received messages for a specified date range, with delivery options for report format and destination.                                          | reporting     | read       |


### Contacts

| Tool                          | Description                                                                                       | Category      | Mode       |
|-------------------------------|---------------------------------------------------------------------------------------------------|---------------|------------|
| **getContactGroups**          | Retrieves a paginated list of contact groups (lists) associated with the account.                 | reporting     | read       |
| **getContactGroupDetails**    | Retrieves details for a specific contact group (list) identified by group_id.                     | reporting     | read       |
| **getContactWithSearch**      | Retrieves a list of contacts, filterable by group, phone number, name, and channel type.          | reporting     | read       |
| **createContactGroup**        | Creates a new contact group (list) with the specified name and optional alias.                    | reporting     | write      |
| **createContact**             | Creates a new contact with the specified details.                                                 | reporting     | write      |
| **updateContact**             | Updates an existing contact identified by contact_id with new details.                            | reporting     | write      |
| **deleteContactGroup**        | Deletes a specific contact group (list) identified by group_id.                                   | reporting     | delete     |

## Getting Started

### Prerequisites

- [Node.js >= 16.0](https://nodejs.org/en/download)
- A provisioned [Sinch Engage account](https://hub.messagemedia.com/)
- Claude Desktop (or any other MCP client). This README is focused on [Claude Desktop](https://claude.ai/download), but the MCP server can be used with any MCP client.

### API credentials

To use the APIs used by the MCP tools, you will need the following credentials:
- `SINCH_ENGAGE_API_KEY` and `SINCH_ENGAGE_API_SECRET` [Sinch Engage Credentials](https://hub.messagemedia.com/api-settings)

### MCP Server Configuration

The Sinch Engage MCP server is available as an NPM package to the executed. Here is how to set it up in the [Claude Desktop](https://claude.ai/download) configuration file (`claude_desktop_config.json`). Remember to fill in the environment variables with your own credentials and the region (currently supported `EU` & `AU`):

```json
{
  "mcpServers": {
    "Sinch Engage": {
      "command": "npx",
      "args": [
        "-y",
        "@sinch-engage/mcp-server"
      ],
      "env": {
        "SINCH_ENGAGE_API_KEY": "<your-key>",
        "SINCH_ENGAGE_API_SECRET": "<your-secret>",
        "SINCH_ENGAGE_REGION": "<region>",
        "MCP_TOOL_CATEGORIES": "reporting, contacts, messaging",
        "MCP_TOOL_MODES": "read, write, delete"
      }
    }
  }
}
```

# Running the MCP Server locally

## Option 1: Start the MCP server with stdio using Claude Desktop

To run the MCP server locally with Claude Desktop, you will need to clone the repository and build the MCP server. This option is useful for local development and testing.

### Step 1: Clone the repository

```bash
git clone https://github.com/messagemedia/sinch-engage-mcp-server.git
```

### Step 2: Install dependencies

```bash
cd sinch-engage-mcp-server
npm install
```

### Step 3: Setup Claude Desktop configuration

Here is an example of how to configure the MCP server in the [Claude Desktop](https://claude.ai/download) configuration file (`claude_desktop_config.json`) where you can provide your Sinch Engage credentials and region (`EU` or `AU`):

```json
{
  "mcpServers": {
    "Sinch Engage": {
      "command": "node",
      "args": ["/path/to/sinch-engage-mcp-server/src/index.js"],
      "env": {
        "SINCH_ENGAGE_API_KEY": "<your-key>",
        "SINCH_ENGAGE_API_SECRET": "<your-secret>",
        "SINCH_ENGAGE_REGION": "<region>",
        "MCP_TOOL_CATEGORIES": "reporting, contacts, messaging",
        "MCP_TOOL_MODES": "read, write, delete"
      }
    }
  }
}
```

### Step 4: (Optional) Filter the tools available in the MCP server

Too many tools mean bigger context, mean higher tokens usage and more confusion for the LLM to select the right tool to use.<br>
You can filter the tools that are available in the MCP server by providing `MCP_TOOL_CATEGORIES` in Claude Desktop configuration options.<br>
<br>
If you want to filter tool by permissions, you can use `MCP_TOOL_MODES` to only choose tools that can either read, write or delete data or any combination of them
