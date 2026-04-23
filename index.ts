// UNIVERSAL BOT v6.0 - FIXED
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import JavaScriptObfuscator from 'javascript-obfuscator';
import crypto from 'crypto';
import 'dotenv/config';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const AUTO_CHANNELS = new Set();
const WARN_MAP = new Map();

// Cleaned BAD_WORDS - removed line-breaks that caused syntax errors
const BAD_WORDS = [
  "scripts","slavery","teen","minor","hotty","hot","hard as fuck","inch","dick","penis",
  "2 girls 1 cup","2g1c","4r5e","5h1t","5hit","5ht","@$$","a s s","a s shole","a55","a55hole","a_s_s",
  "abbo","abeed","abuse","acrotomophilia","africoon","ahole","alabama hot pocket","alaskan pipeline",
  "alligator bait","alligatorbait","amcik","anal","analannie","analprobe","analsex","andskota","anilingus",
  "anus","apeshit","ar5e","arabush","arabushs","areola","areole","argie","armo","armos","arrse","arschloch",
  "arse","arsehole","aryan","ash0le","ash0les","asholes","ass monkey","ass","ass-fucker","ass-hat","ass-pirate",
  "assbag","assbagger","assbandit","assbang","assbanged","assbanger","assbangs","assbite","assblaster",
  "assclown","asscock","asscowboy","asscracker","asses","assface","assfuck","assfucker","assfukka","assgoblin",
  "assh0le","assh0lez","asshat","asshead","assho1e","asshole","assholes","assholz","asshopper","asshore",
  "assjacker","assjockey","asskiss","asskisser","assklown","asslick","asslicker","asslover","assman",
  "assmaster","assmonkey","assmunch","assmuncher","assnigger","asspacker","asspirate","asspuppies",
  "assrammer","assranger","assshit","assshole","asssucker","asswad","asswhole","asswhore","asswipe",
  "asswipes","auto erotic","autoerotic","ayir","azazel","azz","azzhole","b a s t a r d","b i t c h",
  "b o o b","b!+ch","b!tch","b!tchin","b*tch","b00b","b00bies","b00biez","b00bs","b00bz","b17ch","b1tch",
  "b7ch","babeland","babes","baby batter","baby juice","backdoorman","badfuck","ball gag","ball gravy",
  "ball kicking","ball licking","ball sack","ball sucking","ballbag","balllicker","ballsack","bampot",
  "bangbro","bangbros","bangbus","bareback","barely legal","barelylegal","barenaked","barface","barfface",
  "bassterd","bassterds","bastard","bastardo","bastards","bastardz","basterds","basterdz","bastinado",
  "bazongas","bazooms","bbw","bdsm","beaner","beaners","beaney","beaneys","beardedclam","beastality",
  "beastial","beastiality","beastility","beatch","beatoff","beatyourmeat","beaver cleaver","beaver lips",
  "beef curtains","beeyotch","bellend","beotch","bestial","bestiality","bi curious","bi+ch","bi7ch",
  "biatch","bicurious","big black","big breasts","big knockers","big tits","bigass","bigbastard",
  "bigbreasts","bigbutt","bigtits","bimbo","bimbos","bint","birdlock","bitch","bitchass","bitched",
  "bitcher","bitchers","bitches","bitchez","bitchin","bitching","bitchslap","bitchtit","bitchy","biteme",
  "bitties","black cock","blackcock","blackman","blacks","blonde action","blonde on blonde action",
  "blonde on blonde","bloodclaat","blow job","blow your load","blowjob","blowjobs","blue waffle",
  "bluegum","bluegums","blumpkin","boob","boobs","boang","boche","boches","boffing","bogan","bohunk",
  "boink","boiolas","bollick","bollock","bollocks","bollok","bollox","bombers","bomd","bondage","boned",
  "boner","boners","bong","boong","boonga","boongas","boongs","boonie","boonies","booobs","boooobs",
  "booooobs","booooooobs","bootee","bootlip","bootlips","boozer","bosch","bosche","bosches","boschs",
  "bosomy","bounty bar","bounty bars","bountybar","brea5t","breastjob","breastlover","breastman",
  "brown shower","brown showers","brunette action","btch","buceta","buddhahead","buddhaheads","buffies",
  "bugger","buggered","buggery","bukake","bukkake","bullcrap","bulldike","bulldyke","bullet vibe",
  "bullshit","bullshits","bullshitted","bullturds","bumblefuck","bumfuck","bung hole","bung","bunga",
  "bungas","bunghole","bunny fucker","burr head","burr heads","burrhead","burrheads","butchbabes",
  "butchdike","butchdyke","butt plug","butt-pirate","buttbang","buttcheeks","buttface","buttfuck",
  "buttfucker","buttfuckers","butthead","butthole","buttman","buttmuch","buttmunch","buttmuncher",
  "buttpirate","buttplug","buttstain","buttwipe","byatch","fuck","retard","sybau","dumbass","fucktard",
  "faggot","nigga","nigger","blacky","skid","skidder","scammer","dickass","bisexual","loner","gay",
  "crashout","ragebait","ragebaiting","scamming","scam","rat","executor","script","crazy","retarded",
  "deadass","sex","fucking"
];

const SEVERE = ['nigger','nigga','faggot','fucktard','kike','chink','rape','nazi'];
const MODERATE = ['fuck','shit','bitch','asshole','cunt','dick','pussy','bastard','bullshit','fucking'];

function getTimeout(w){
  const x = w.toLowerCase();
  if(SEVERE.includes(x)) return 60;
  if(MODERATE.includes(x)) return 10;
  return 5;
}

function encrypt(t,p='universal'){
  const i=crypto.randomBytes(16);
  const k=crypto.scryptSync(p,'salt',32);
  const c=crypto.createCipheriv('aes-256-cbc',k,i);
  return i.toString('hex')+':'+c.update(t,'utf8','hex')+c.final('hex');
}

function decrypt(t,p='universal'){
  try{
    const[h,d]=t.split(':');
    const i=Buffer.from(h,'hex');
    const k=crypto.scryptSync(p,'salt',32);
    const dc=crypto.createDecipheriv('aes-256-cbc',k,i);
    return dc.update(d,'hex','utf8')+dc.final('utf8');
  }catch{return null;}
}

function jsObfuscate(code){
  return JavaScriptObfuscator.obfuscate(code,{
    compact:true,
    controlFlowFlattening:true,
    stringArray:true,
    stringArrayThreshold:0.75
  }).getObfuscatedCode();
}

async function obfuscateLuaRemote(script){
  // Pure-local 6-layer obfuscator - no API, taken from c4l3bkidd's panel
  const b64 = s => Buffer.from(s, 'utf8').toString('base64');
  const HDR = `local function bxor(a,b)
if bit32 and bit32.bxor then return bit32.bxor(a,b) end
local r=0
for i=0,7 do
local xa=a%2 xb=b%2
if xa~=xb then r=r+2^i end
a=math.floor(a/2) b=math.floor(b/2)
end
return r
end
local loadf=loadstring or load or function() end`;

  // Layer 1
  let l1 = `${HDR} local B='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' local D='${b64(script)}' local X=D:gsub('[^'..B..'=]','') local R='' X:gsub('.',function(C) if C~='=' then local F=(B:find(C,1,true)or 1)-1 for i=6,1,-1 do R=R..((F%2^i-F%2^(i-1)>0)and'1'or'0') end end end) local S='' R:gsub('%d%d%d%d%d%d%d%d',function(B) local N=0 for i=1,8 do N=N+(B:sub(i,i)=='1'and 2^(8-i)or 0) end S=S..string.char(N) end) local f=loadf(S) if f then return f() end`;
  
  // Layer 2
  const k2 = 50 + Math.floor(Math.random()*100);
  const e2 = [...l1].map(c => c.charCodeAt(0) ^ k2);
  let l2 = `${HDR} local k=${k2} local t={${e2.join(',')}} local s='' for i=1,#t do s=s..string.char(bxor(t[i],k)) end local f=loadf(s) if f then return f() end`;
  
  // Layer 3
  let l3 = `${HDR} local d='${b64(l2)}' local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' d=d:gsub('[^'..b..'=]','') local r='' d:gsub('.',function(c) if c~='=' then local f=(b:find(c,1,true)or 1)-1 for i=6,1,-1 do r=r..((f%2^i-f%2^(i-1)>0)and'1'or'0') end end end) local o='' r:gsub('%d%d%d%d%d%d%d%d',function(b) local n=0 for i=1,8 do n=n+(b:sub(i,i)=='1'and 2^(8-i)or 0) end o=o..string.char(n) end) local f=loadf(o) if f then return f() end`;
  
  // Layer 4
  const k4 = 30 + Math.floor(Math.random()*100);
  const d4 = Array.from(new TextEncoder().encode(l3), b => b ^ k4);
  let l4 = `${HDR} local k=${k4} local t={${d4.join(',')}} local s='' for i=1,#t do s=s..string.char(bxor(t[i],k)) end local f=loadf(s) if f then return f() end`;
  
  // Layer 5
  const b5 = Array.from(new TextEncoder().encode(l4));
  let l5 = `${HDR} local t={${b5.join(',')}} local s='' for i=1,#t do s=s..string.char(t[i]) end local f=loadf(s) if f then return f() end`;
  
  // Layer 6
  const k6 = 10 + Math.floor(Math.random()*100);
  const d6 = Array.from(new TextEncoder().encode(l5), b => b ^ k6);
  return `${HDR} local k=${k6} local t={${d6.join(',')}} local s='' for i=1,#t do s=s..string.char(bxor(t[i],k)) end local f=loadf(s) if f then return f() end`;
}

function layeredDeobfuscate(code){
  try{
    const m=code.match(/local d=\{([^}]+)\}/);
    if(!m) return null;
    const k=parseInt(code.match(/local k=(\d+)/)[1]);
    return m[1].split(',').map(n=>String.fromCharCode(parseInt(n)^k)).join('');
  }catch{return null;}
}

// AUTO-MOD
client.on('messageCreate', async m => {
  if(!m.guild || m.author.bot || !AUTO_CHANNELS.has(m.channel.id)) return;
  const mem = m.member;
  if(!mem?.moderatable) return;
  const c = m.content.toLowerCase();
  const f = BAD_WORDS.find(w => c.includes(w.toLowerCase()));
  let reason=null, mins=0;
  if(f){
    reason='Prohibited language detected';
    mins=getTimeout(f);
  }else if(/https?:\/\//.test(m.content)){
    const safe=['discord.com','youtube.com','youtu.be'];
    if(!safe.some(s=>m.content.includes(s))){
      reason='Unauthorized link';
      mins=15;
    }
  }
  if(reason){
    await m.delete().catch(()=>{});
    await mem.timeout(mins*60000, `Auto: ${reason}`);
    const e = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('ðŸ”‡ Automatic Moderation')
      .setDescription(`${m.author} has been timed out`)
      .addFields(
        {name:'â±ï¸ Duration', value:`${mins} minutes`, inline:true},
        {name:'ðŸ“ Reason', value:reason, inline:true},
        {name:'ðŸ‘® Moderator', value:'Auto-Mod', inline:true}
      )
      .setFooter({text:'Universal Bot v6.0'})
      .setTimestamp();
    const msg = await m.channel.send({embeds:[e]});
    setTimeout(()=>msg.delete().catch(()=>{}),10000);
  }
});

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Ban a member permanently').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o=>o.setName('user').setDescription('User to ban').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('unban').setDescription('Unban a user').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addStringOption(o=>o.setName('userid').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a member').setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o=>o.setName('minutes').setDescription('Minutes').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('untimeout').setDescription('Remove timeout').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('warn').setDescription('Warn a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('addrole').setDescription('Add role to member').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true)),
  new SlashCommandBuilder().setName('removerole').setDescription('Remove role from member').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true)),
  new SlashCommandBuilder().setName('say').setDescription('Make the bot say something').addStringOption(o=>o.setName('message').setDescription('Message').setRequired(true)).addChannelOption(o=>o.setName('channel').setDescription('Channel').setRequired(false)),
  new SlashCommandBuilder().setName('automatedchannel').setDescription('Toggle auto-moderation').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption(o=>o.setName('channel').setDescription('Channel').setRequired(true)).addBooleanOption(o=>o.setName('enable').setDescription('On/off').setRequired(true)),
  new SlashCommandBuilder().setName('encrypt').setDescription('Encrypt text with AES-256').addStringOption(o=>o.setName('text').setDescription('Text').setRequired(true)).addStringOption(o=>o.setName('password').setDescription('Password').setRequired(false)),
  new SlashCommandBuilder().setName('decrypt').setDescription('Decrypt text').addStringOption(o=>o.setName('text').setDescription('Text').setRequired(false)).addAttachmentOption(o=>o.setName('file').setDescription('File').setRequired(false)).addStringOption(o=>o.setName('password').setDescription('Password').setRequired(false)),
  new SlashCommandBuilder().setName('obfuscate').setDescription('Obfuscate JavaScript').addStringOption(o=>o.setName('code').setDescription('JavaScript code').setRequired(false)).addAttachmentOption(o=>o.setName('file').setDescription('JS file').setRequired(false)),
  new SlashCommandBuilder().setName('layered-obfuscate').setDescription('Layered Lua obfuscation').addStringOption(o=>o.setName('code').setDescription('Lua code').setRequired(false)).addAttachmentOption(o=>o.setName('file').setDescription('Lua file').setRequired(false))
].map(c=>c.toJSON());

client.once('ready', async () => {
  console.log('Bot ready');
  await new REST({version:'10'}).setToken(TOKEN).put(Routes.applicationCommands(CLIENT_ID), {body: commands});
});

client.on('interactionCreate', async i => {
  if(!i.isChatInputCommand()) return;
  await i.deferReply({ephemeral:true});
  try{
    const user = i.options.getUser('user');
    const member = user ? await i.guild.members.fetch(user.id).catch(()=>null) : null;
    const reason = i.options.getString('reason') || 'No reason provided';
    let embed;
    switch(i.commandName){
      case 'ban':
        await member.ban({reason});
        embed = new EmbedBuilder().setColor(0xFF0000).setTitle('Member Banned').setDescription(`**${user.tag}** has been permanently banned`).addFields({name:'Moderator',value:i.user.tag,inline:true},{name:'Reason',value:reason,inline:true}).setTimestamp();
        break;
      case 'unban':
        await i.guild.bans.remove(i.options.getString('userid'));
        embed = new EmbedBuilder().setColor(0x00FF00).setTitle('User Unbanned').setDescription(`User ID ${i.options.getString('userid')} unbanned`).setTimestamp();
        break;
      case 'kick':
        await member.kick(reason);
        embed = new EmbedBuilder().setColor(0xFF8800).setTitle('Member Kicked').setDescription(`**${user.tag}** was kicked`).addFields({name:'Reason',value:reason}).setTimestamp();
        break;
      case 'timeout':
        const mins = i.options.getInteger('minutes');
        await member.timeout(mins*60000, reason);
        embed = new EmbedBuilder().setColor(0xFFAA00).setTitle('Member Timed Out').setDescription(`${user} timed out for **${mins} minutes**`).addFields({name:'Reason',value:reason}).setTimestamp();
        break;
      case 'untimeout':
        await member.timeout(null);
        embed = new EmbedBuilder().setColor(0x00AAFF).setTitle('Timeout Removed').setDescription(`${user.tag} can speak again`).setTimestamp();
        break;
      case 'warn':
        const w = (WARN_MAP.get(user.id)||0)+1;
        WARN_MAP.set(user.id, w);
        embed = new EmbedBuilder().setColor(0xFFDD00).setTitle('Warning Issued').setDescription(`${user} warned`).addFields({name:'Warns',value:`${w}/3`,inline:true},{name:'Reason',value:reason,inline:true}).setTimestamp();
        if(w>=3){ await member.timeout(600000,'3 warnings'); WARN_MAP.set(user.id,0); embed.addFields({name:'Action',value:'Auto timeout 10m'}); }
        break;
      case 'addrole':
        await member.roles.add(i.options.getRole('role'));
        embed = new EmbedBuilder().setColor(0x00FF00).setTitle('Role Added');
        break;
      case 'removerole':
        await member.roles.remove(i.options.getRole('role'));
        embed = new EmbedBuilder().setColor(0xFF0000).setTitle('Role Removed');
        break;
      case 'say':
        const msg = i.options.getString('message');
        const ch = i.options.getChannel('channel') || i.channel;
        await ch.send({content: msg});
        embed = new EmbedBuilder().setColor(0x00AAAA).setTitle('Message Sent').setDescription(`Sent to ${ch}`);
        break;
      case 'automatedchannel':
        const channel = i.options.getChannel('channel');
        const en = i.options.getBoolean('enable');
        en ? AUTO_CHANNELS.add(channel.id) : AUTO_CHANNELS.delete(channel.id);
        embed = new EmbedBuilder().setColor(en?0x00FF00:0xFF0000).setTitle(en?'Enabled':'Disabled').setDescription(`Auto-mod ${en?'enabled':'disabled'} for ${channel}`);
        break;
      case 'encrypt':
        const enc = encrypt(i.options.getString('text'), i.options.getString('password')||'universal');
        return i.editReply({files:[{attachment:Buffer.from(enc), name:'encrypted.txt'}]});
      case 'decrypt':
        let inp = i.options.getString('text')||'';
        const f = i.options.getAttachment('file');
        if(f) inp = await (await fetch(f.url)).text();
        const pw = i.options.getString('password')||'universal';
        const dec = decrypt(inp,pw) || layeredDeobfuscate(inp) || 'Decryption failed';
        return i.editReply({files:[{attachment:Buffer.from(dec), name:'decrypted.txt'}]});
      case 'obfuscate':
        let code = i.options.getString('code') || '';
        const file = i.options.getAttachment('file');
        if(file) code = await (await fetch(file.url)).text();
        if(!code) throw new Error('Provide code or attach a .js file');
        const ob = jsObfuscate(code);
        return i.editReply({files:[{attachment:Buffer.from(ob), name:'obfuscated.js'}]});
      case 'layered-obfuscate':
        let lua = i.options.getString('code') || '';
        const luaFile = i.options.getAttachment('file');
        if(luaFile) lua = await (await fetch(luaFile.url)).text();
        if(!lua) throw new Error('Provide Lua code or attach a .lua file');
        const lo = await obfuscateLuaRemote(lua);
        return i.editReply({files:[{attachment:Buffer.from(lo), name:'obfuscated.lua'}]});
    }
    await i.editReply({embeds:[embed]});
  }catch(e){
    await i.editReply(`âŒ Error: ${e.message}`);
  }
});

client.login(TOKEN);
