import Discord from "discord.js";
import Database from "./database.js";
import { embedReply } from "./util.js";

/*
CONFIGURATION UTILITIES
This section includes utilities related to the configuration, but not specific to roles or channels
*/

// Sends a message to the channel with the server configuration.
export function showConfig(interaction, db) {
  db.get("configuration").then((configuration) => {
    // Console Logging
    console.log("Showing configuration.");
    console.log(configuration);

    // Parse Json into javascript object
    const configJson = JSON.parse(configuration);

    // Extract roles and channels from array
    const roles = configJson.configuration.roles;
    const channels = configJson.configuration.channels;

    // Format role ids for easy viewing
    let roleText = "";
    for (let i = 0; i < roles.length; i++) {
      let currentRole = roles[i]; // Parse string into an object
      roleText += `<@&${currentRole.id}> (ID: ${currentRole.id})\n`; // Create a new role line
    }

    // Format channel ids for easy viewing
    let channelText = "";
    for (let i = 0; i < channels.length; i++) {
      let currentChannel = channels[i]; // Parse string into an object
      channelText += `<#${currentChannel.id}> (ID: ${currentChannel.id})\n`; // Create a channel line
    }

    // Creates message template literal
    const message = `ROLES: 
    ${roleText}
    CHANNELS: 
    ${channelText}`;

    // Embeds message
    embedReply("Configuration Settings:", message, interaction);
  });
}

// Resets the bot configuration
export function resetConfig(interaction, db) {
  console.log("Resetting bot configuration.");

  const configuration = {
    configuration: {
      channels: [],
      roles: [],
    },
  };

  db.set("configuration", JSON.stringify(configuration));

  // Send message that reset is successful
  const title = "Reset Successful";
  const message = `The configuration has been reset. The bot will listen on all channels and accept commands from all roles. It is recommended to configure moderator roles before using this bot.
  
  Type \`!help\` to see how to configure the bot.`;
  embedReply(title, message, interaction);
}

/*
ROLES
This section includes any role specific functions
*/

// Checks if role exists, returns true or false
function roleExists(role, interaction) {
  // Returns true if role exists
  return interaction.guild.roles.cache.some((r) => r.id === role.id);
}

// Adds role to bot moderator roles
export function addRole(role, interaction, db) {
  // If role exists in server
  if (roleExists(role, interaction)) {
    // Logging
    console.log("Role exists. Adding to database.");

    // Get the configuration from the database
    db.get("configuration").then((configuration) => {
      // Parse Json into javascript object
      const configJson = JSON.parse(configuration);

      // If role exists in configuration
      if (
        configJson.configuration.roles.some(
          (roleItem) => roleItem.id === role.id,
        )
      ) {
        // Don't add role

        console.log("Failed to add role: already in configuration"); // Logging

        // Message
        const title = "ERROR: Role already added!";
        const message = `The role <@&${role.id}> is already included in the configuration.
        
        Type \`!show config\` to see the current configuration.`;
        embedReply(title, message, interaction);

        // If role doesn't exist in configuration
      } else {
        // Create new role array
        var newRole = {
          id: role.id,
        };

        configJson.configuration.roles.push(newRole); // Adds role to list of roles

        db.set("configuration", JSON.stringify(configJson)); // Sets the updated list into database

        console.log("Role added successfully."); // Logging

        // Message
        const title = "New Role Added";
        const message = `The role has been added sucessfully: 
        
        <@&${role.id}> (ID: ${role.id})

        Type \`/showconfig\` to see the current configuration.`;
        embedReply(title, message, interaction);
      }
    });

    // If role doesn't exist in server
  } else {
    // Don't add role
    const title = "ERROR: Failed to add role!";
    const message = `The role ${role} does not exist and could not be added.`;
    embedReply(title, message, interaction);
  }
}

// Remove role from bot moderator roles
export function removeRole(role, interaction, db) {
  const roleId = role.id;

  // Get the configuration from the database
  db.get("configuration").then((configuration) => {
    // Parse Json into javascript object
    const configJson = JSON.parse(configuration);

    // Check if the role is in the database
    // If role exists in configuration
    if (
      configJson.configuration.roles.some((roleItem) => roleItem.id === roleId)
    ) {
      // Find index of this role
      const index = configJson.configuration.roles.findIndex(
        (item) => item.id === roleId,
      );

      // Remove role from array
      if (index > -1) {
        configJson.configuration.roles.splice(index, 1);
      }

      db.set("configuration", JSON.stringify(configJson)); // Sets the updated list into database

      // Show warning if last role
      if (configJson == null || configJson.configuration.roles.length === 0) {
        const title = "Warning: Last role removed";
        const message = `The role <@&${role.id}> was removed from configuration. 
        
        There are no roles set to moderate the bot. It is recommended to set at least one role.
        
        Type \`/help\` to see how to add roles.`;
        embedReply(title, message, interaction);
        // Show regular message if not
      } else {
        const title = "Role removed from configuration.";
        const message = `The role <@&${role.id}> was removed from configuration successfully!`;
        embedReply(title, message, interaction);
      }
    } else {
      const title = "ERROR: Failed to remove role!";
      const message = `The role <@&${role.id}> is missing from the configuration and could not be removed.
      
      Type \`/showconfig\` to see the roles currently in the configuration.`;
      embedReply(title, message, interaction);
    }
  });
}

// Returns true if user role is in config, or if configuration.roles is empty
export function authenticateRole(interaction, db) {
  // Get the configuration from the database
  return db.get("configuration").then((configuration) => {
    // Parse Json into javascript object
    const configJson = JSON.parse(configuration);
    // Check if the role is in the database
    if (configJson == null || configJson.configuration.roles.length === 0) {
      // no role are in config, authorized
      return true;
    } else if (
      configJson.configuration.roles.some((roleItem) =>
        interaction.member.roles.cache.has(roleItem.id),
      )
    ) {
      // role is in configuration, authorized
      return true;
    } else {
      // role is not in configuration and configuration contains at least 1 role, forbidden
      return false;
    }
  });
}

/*
CHANNELS
This section includes any channel specific functions
*/

// Check if channel exists, return true or false
function channelExists(channel, interaction) {
  // Returns true if channel exists
  return interaction.guild.channels.cache.some((c) => c.id === channel.id);
}

// Add channel to bot allowed channels
export function addChannel(channel, interaction, db) {
  // If channel exists in server
  if (channelExists(channel, interaction)) {
    // Get the configuration from the database
    db.get("configuration").then((configuration) => {
      // Parse Json into javascript object
      const configJson = JSON.parse(configuration);
      // If channel exists in configuration
      if (
        configJson.configuration.channels.some(
          (channelItem) => channelItem.id === channel.id,
        )
      ) {
        const title = "ERROR: Channel already added!";
        const message = `The channel >${channel}< is already in the configuration.
        
        Type \`/showconfig\` to see the current configuration.`;
        embedReply(title, message, interaction);
      } else {
        var newChannel = {
          id: channel.id,
        };
        configJson.configuration.channels.push(newChannel); // Adds channel to list of channels
        db.set("configuration", JSON.stringify(configJson)); // Sets the updated list into database
        const title = "New Channel Added";
        const message = `The channel has been added sucessfully: 
        
        <#${channel.id}> (ID: ${channel.id})

        Type \`/showconfig\` to see the current configuration.`;
        embedReply(title, message, interaction);
      }
    });
  } else {
    const title = "ERROR: Failed to add channel!";
    const message = `The channel <#${channel.id}> does not exist and could not be added.

    Type \`!channels\` to see the available channels on this server.`;
    embedReply(title, message, interaction);
  }
}

// Remove channel from bot allowed channels
export function removeChannel(channel, interaction, db) {
  // Get the configuration from the database
  db.get("configuration").then((configuration) => {
    // Parse Json into javascript object
    const configJson = JSON.parse(configuration);
    // If channel exists in configuration
    if (
      configJson.configuration.channels.some(
        (channelItem) => channelItem.id === channel.id,
      )
    ) {
      // Find index of this channel
      const index = configJson.configuration.channels.findIndex(
        (item) => item.id === channel.id,
      );
      // Remove role from array
      if (index > -1) {
        configJson.configuration.channels.splice(index, 1);
      }
      db.set("configuration", JSON.stringify(configJson)); // Sets the updated list into database
      // Show warning if last channel
      if (configJson.configuration.channels.length === 0) {
        const title = "Warning: Last channel removed";
        const message = `The channel <#${channel.id}> was removed from configuration. 
        
        The bot will respond on every channel on this server. If you don't want this, set at least one channel.
        
        Type \`/help\` to see how to add channels.`;
        embedReply(title, message, interaction);
        // Show regular message if not
      } else {
        const title = "Channel removed from configuration";
        const message = `The channel <#${channel.id}> was removed from configuration successfully!`;
        embedReply(title, message, interaction);
      }
    } else {
      const title = "ERROR: Could not remove channel!";
      const message = `The channel <#${channel.id}> is missing from the configuration and could not be removed.
      
      Type \`/showconfig\` to see the channels currently in the configuration.`;
      embedReply(title, message, interaction);
    }
  });
}

// Returns true if channel is in config, or if configuration.channels is empty
export function authenticateChannel(interaction, db) {
  // Get the configuration from the database
  return db.get("configuration").then((configuration) => {
    // Parse Json into javascript object
    const configJson = JSON.parse(configuration);
    if (configJson == null || configJson.configuration.channels.length === 0) {
      // no channels are in config, authorized
      return true;
    } else if (
      configJson.configuration.channels.some(
        (channelItem) => channelItem.id === interaction.channel.id,
      )
    ) {
      // channel is in configuration, authorized
      return true;
    } else {
      // channel is not in configuration and configuration contains at least 1 channel, forbidden
      return false;
    }
  });
}
