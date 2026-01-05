import { Receipt } from '../types/ticket';
import { ClubEntity } from '../types/entity';
import { TicketPurchase } from '../types/ticket';

export function formatDisplayName(name: string): string {
  // Convert to small caps style using Unicode characters
  const smallCapsMap: { [key: string]: string } = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ',
    'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ',
    'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
    's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
    'y': 'ʏ', 'z': 'ᴢ'
  };

  return name.split('').map(char => {
    const lower = char.toLowerCase();
    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      // Keep uppercase letters as is
      return char;
    }
    return smallCapsMap[lower] || char;
  }).join('');
}

export function generateReceipt(entity: ClubEntity, purchase: TicketPurchase): string {
  const styledRaffle = formatDisplayName('raffle');
  const divider = '~~~~~~~~~~~~~~~~~~~~~';
  
  let giftLine = '';
  if (purchase.isGift && purchase.gifterName) {
    giftLine = `🎁 GIFT from: ${purchase.gifterName}\n`;
  }
  
  const receipt = `
${entity.emoji} ${entity.displayName} ${styledRaffle} ${entity.emoji}
${entity.tagline}
${divider}
${giftLine}Buyer: ${purchase.buyerName}
Tickets purchased: ${purchase.ticketCount}
Price per ticket: $${purchase.pricePerTicket}
Total Price: $${purchase.totalPrice}
Ticket Numbers: ${purchase.startTicketNumber}-${purchase.endTicketNumber}
Raffler Name: ${purchase.rafflerName}
${divider}
`.trim();

  return receipt;
}

export function generateReceiptFromData(data: Receipt): string {
  const styledRaffle = formatDisplayName('raffle');
  const divider = '~~~~~~~~~~~~~~~~~~~~~';
  
  const receipt = `
${data.entityEmoji} ${data.entityName} ${styledRaffle} ${data.entityEmoji}
Thanks for your Purchase.. and good luck~
${divider}
Buyer: ${data.buyerName}
Tickets purchased: ${data.ticketCount}
Price per ticket: $${data.pricePerTicket}
Total Price: $${data.totalPrice}
Ticket Numbers: ${data.ticketRange}
Raffler Name: ${data.rafflerName}
${divider}
`.trim();

  return receipt;
}
