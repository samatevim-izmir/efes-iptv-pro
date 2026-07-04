import { IPTVChannel } from "../types";

export function parseM3U(content: string): IPTVChannel[] {
  const channels: IPTVChannel[] = [];
  const lines = content.split("\n");
  
  let currentChannel: Partial<IPTVChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("#EXTINF:")) {
      currentChannel = {};
      
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const logo = logoMatch ? logoMatch[1] : "";

      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const category = groupMatch ? groupMatch[1] : "Custom Channels";

      // Extract channel language if present
      const langMatch = line.match(/tvg-language="([^"]+)"/i) || line.match(/language="([^"]+)"/i);
      const language = langMatch ? langMatch[1].substring(0, 2).toUpperCase() : "GLOBAL";

      // Extract name (everything after the last comma)
      const lastCommaIndex = line.lastIndexOf(",");
      let name = "Custom Channel";
      if (lastCommaIndex !== -1) {
        name = line.substring(lastCommaIndex + 1).trim();
      }

      currentChannel.name = name;
      currentChannel.logo = logo || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200&auto=format&fit=crop";
      currentChannel.category = category;
      currentChannel.language = language;
      currentChannel.description = `${name} kanalı, özel M3U listenizden yüklendi.`;
      
      // Determine type based on category terms
      const lowerCat = category.toLowerCase();
      const lowerName = name.toLowerCase();
      
      if (lowerCat.includes("movie") || lowerCat.includes("film") || lowerName.includes("cinema")) {
        currentChannel.type = "movie";
      } else if (lowerCat.includes("series") || lowerCat.includes("dizi") || lowerName.includes("episode")) {
        currentChannel.type = "series";
      } else if (lowerCat.includes("belgesel") || lowerCat.includes("docu")) {
        currentChannel.type = "documentary";
      } else {
        currentChannel.type = "live";
      }

    } else if (line.startsWith("http")) {
      if (currentChannel.name) {
        currentChannel.streamUrl = line;
        
        // Generate a deterministic short ID
        const cleanName = currentChannel.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        currentChannel.id = `custom_${cleanName}_${channels.length}`;
        
        channels.push(currentChannel as IPTVChannel);
        currentChannel = {};
      }
    }
  }

  return channels;
}
