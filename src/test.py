"""Cog responsible for giving out roles in response to reactions."""

import discord
from discord.ext import commands

#############################################################
# Variables (Temporary)
guild_id = 562095551349522442
role_assignment_message_id = 747135493757468752
role_assignment_channel_id = 647945137502289930

# Roles that can't get ranks
unranked_role_id = 566324301557530624
muted_role_id = 633121676187402260

# Can't get VN challenge role
n4_role_id = 566335554199879696
#############################################################

class Reactions(commands.Cog):
    """Reaction for event roles."""

    def __init__(self, bot):
        self.bot = bot
        #  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! TODO:sssshi IMPLEMENT DOWNLOADING FOR REAL  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        self.event_roles = DOWNLOAD DATA FROM TEST.JSON."event-roles" (load string and use json.loads() maybe idk)

    @commands.Cog.listener()
    async def on_ready(self):
        self.myguild = self.bot.get_guild(guild_id)
        # Store reference to guild roles for all event roles
        for event in event_roles:
            event.role = self.myguild.get_role(event.id)

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, rawevent: discord.RawReactionActionEvent):
        try:
            reaction_member = self.myguild.get_member(rawevent.user_id)
        except AttributeError:
            return

        vn_role_allowed = True

        try:
            await reaction_member.create_dm()
            private_channel = reaction_member.dm_channel
        except discord.errors.HTTPException:
            pass

        if rawevent.message_id == role_assignment_message_id:
            for role in reaction_member.roles:
                if role.id == muted_role_id:
                    await private_channel.send(f"{reaction_member.mention} You can't get event roles while muted.")
                    return
                if role.id == unranked_role_id:
                    await private_channel.send(
                        f"{reaction_member.mention} You have to pass the N4 quiz before you have access to event roles!")
                    return
                if role.id == n4_role_id:
                    vn_role_allowed = False

        if rawevent.message_id == role_assignment_message_id:

            emoji = str(rawevent.emoji)

            # Handle exception for VN challenge role
            if (emoji == "🖋️" and !vn_role_allowed):
                await private_channel.send(f"{reaction_member.mention} You have to pass the N3 quiz before you have "
                                           f"access to the VN Challenge. \n Type `$levelup`.")
            else:
                added_role = False
                # Add role if emoji matches any event role emoji
                for event in event_roles:
                    if emoji = event.emoji:
                        await reaction_member.add_roles(event.role)
                        await private_channel.send(f"{reaction_member.mention} You joined the {event.title}!")
                        added_role = True
                        break
                # Remove emoji if it didn't result in adding any role. This is to prevent bloating the message with unrelated emojies like 🥵, 🌭, ✡️, etc.
                if !added_role:
                    react_channel = self.myguild.get_channel(role_assignment_channel_id)
                    reaction_message = await react_channel.fetch_message(role_assignment_message_id)
                    await reaction_message.remove_reaction(rawevent.emoji, rawevent.member)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, rawevent: discord.RawReactionActionEvent):
        reaction_member = self.myguild.get_member(rawevent.user_id)

        await reaction_member.create_dm()
        private_channel = reaction_member.dm_channel

        # Do nothing for muted and unranked roles
        for role in reaction_member.roles:
            if role.id == muted_role_id or role.id == unranked_role_id:
                return

        # Remove role and send DM message about role removal if emoji matches any event role emoji
        if rawevent.message_id == role_assignment_message_id:

            emoji = str(rawevent.emoji)

            for event in event_roles:
                if emoji === event.emoji:
                    await reaction_member.remove_roles(event.role)
                    await private_channel.send(f"{reaction_member.mention} You left the {event.title}.")

def setup(bot):
    bot.add_cog(Reactions(bot))
