import ExcelJS from 'exceljs';
import { entityRepository, purchaseRepository, raffleRepository } from '../data/repositories';
import db from '../data/database';

export class ExportService {
  async exportPurchasesToExcel(filterEntityIds?: string[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Raffle System';
    workbook.created = new Date();

    // Purchases Sheet
    const purchasesSheet = workbook.addWorksheet('Purchases');
    purchasesSheet.columns = [
      { header: 'Purchase ID', key: 'id', width: 40 },
      { header: 'Club', key: 'club', width: 25 },
      { header: 'Buyer Name', key: 'buyerName', width: 20 },
      { header: 'Raffler Name', key: 'rafflerName', width: 20 },
      { header: 'Ticket Count', key: 'ticketCount', width: 15 },
      { header: 'Price Per Ticket', key: 'pricePerTicket', width: 18 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Ticket Range', key: 'ticketRange', width: 15 },
      { header: 'Purchase Date', key: 'createdAt', width: 22 },
    ];

    let purchases = purchaseRepository.findAll();
    let entities = entityRepository.findAll();
    
    // Filter by entity IDs if provided
    if (filterEntityIds && filterEntityIds.length > 0) {
      purchases = purchases.filter(p => filterEntityIds.includes(p.entityId));
      entities = entities.filter(e => filterEntityIds.includes(e.id));
    }
    
    const entityMap = new Map(entities.map(e => [e.id, e]));

    purchases.forEach(purchase => {
      const entity = entityMap.get(purchase.entityId);
      purchasesSheet.addRow({
        id: purchase.id,
        club: entity ? `${entity.emoji} ${entity.displayName}` : purchase.entityId,
        buyerName: purchase.buyerName,
        rafflerName: purchase.rafflerName,
        ticketCount: purchase.ticketCount,
        pricePerTicket: purchase.pricePerTicket,
        totalPrice: purchase.totalPrice,
        ticketRange: `${purchase.startTicketNumber}-${purchase.endTicketNumber}`,
        createdAt: purchase.createdAt.toISOString(),
      });
    });

    // Style header row
    purchasesSheet.getRow(1).font = { bold: true };
    purchasesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    purchasesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Tickets Sheet
    const ticketsSheet = workbook.addWorksheet('Tickets');
    ticketsSheet.columns = [
      { header: 'Ticket ID', key: 'id', width: 40 },
      { header: 'Ticket Number', key: 'ticketNumber', width: 15 },
      { header: 'Purchase ID', key: 'purchaseId', width: 40 },
      { header: 'Buyer Name', key: 'buyerName', width: 20 },
      { header: 'Club', key: 'club', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    purchases.forEach(purchase => {
      const entity = entityMap.get(purchase.entityId);
      purchase.tickets.forEach(ticket => {
        ticketsSheet.addRow({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          purchaseId: ticket.purchaseId,
          buyerName: purchase.buyerName,
          club: entity ? `${entity.emoji} ${entity.displayName}` : purchase.entityId,
          createdAt: ticket.createdAt.toISOString(),
        });
      });
    });

    ticketsSheet.getRow(1).font = { bold: true };
    ticketsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    ticketsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Entities Sheet
    const entitiesSheet = workbook.addWorksheet('Clubs');
    entitiesSheet.columns = [
      { header: 'ID', key: 'id', width: 40 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Display Name', key: 'displayName', width: 25 },
      { header: 'Emoji', key: 'emoji', width: 10 },
      { header: 'Tagline', key: 'tagline', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    entities.forEach(entity => {
      entitiesSheet.addRow({
        id: entity.id,
        name: entity.name,
        displayName: entity.displayName,
        emoji: entity.emoji,
        tagline: entity.tagline,
        createdAt: entity.createdAt.toISOString(),
      });
    });

    entitiesSheet.getRow(1).font = { bold: true };
    entitiesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    entitiesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Raffles Sheet
    const rafflesSheet = workbook.addWorksheet('Raffles');
    rafflesSheet.columns = [
      { header: 'ID', key: 'id', width: 40 },
      { header: 'Club', key: 'club', width: 25 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Prize', key: 'prize', width: 30 },
      { header: 'Ticket Price', key: 'ticketPrice', width: 15 },
      { header: 'Max Tickets', key: 'maxTickets', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Winning Ticket', key: 'winningTicket', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    const raffles = raffleRepository.findAll();
    raffles.forEach(raffle => {
      const entity = entityMap.get(raffle.entityId);
      rafflesSheet.addRow({
        id: raffle.id,
        club: entity ? `${entity.emoji} ${entity.displayName}` : raffle.entityId,
        name: raffle.name,
        prize: raffle.prizeDescription,
        ticketPrice: raffle.ticketPrice,
        maxTickets: raffle.maxTickets,
        status: raffle.isActive ? 'Active' : 'Ended',
        winningTicket: raffle.winningTicketNumber || '-',
        createdAt: raffle.createdAt.toISOString(),
      });
    });

    rafflesSheet.getRow(1).font = { bold: true };
    rafflesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    rafflesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    const totalRevenue = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalTickets = purchases.reduce((sum, p) => sum + p.ticketCount, 0);

    summarySheet.addRow({ metric: 'Total Clubs', value: entities.length });
    summarySheet.addRow({ metric: 'Total Purchases', value: purchases.length });
    summarySheet.addRow({ metric: 'Total Tickets Sold', value: totalTickets });
    summarySheet.addRow({ metric: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` });
    summarySheet.addRow({ metric: 'Total Raffles', value: raffles.length });
    summarySheet.addRow({ metric: 'Active Raffles', value: raffles.filter(r => r.isActive).length });
    summarySheet.addRow({ metric: 'Export Date', value: new Date().toISOString() });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportEntityDataToExcel(entityId: string): Promise<Buffer | null> {
    const entity = entityRepository.findById(entityId);
    if (!entity) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Raffle System';
    workbook.created = new Date();

    // Entity Info Sheet
    const infoSheet = workbook.addWorksheet('Club Info');
    infoSheet.columns = [
      { header: 'Property', key: 'property', width: 20 },
      { header: 'Value', key: 'value', width: 40 },
    ];

    infoSheet.addRow({ property: 'ID', value: entity.id });
    infoSheet.addRow({ property: 'Name', value: entity.name });
    infoSheet.addRow({ property: 'Display Name', value: entity.displayName });
    infoSheet.addRow({ property: 'Emoji', value: entity.emoji });
    infoSheet.addRow({ property: 'Tagline', value: entity.tagline });
    infoSheet.addRow({ property: 'Created At', value: entity.createdAt.toISOString() });

    infoSheet.getRow(1).font = { bold: true };

    // Purchases Sheet
    const purchasesSheet = workbook.addWorksheet('Purchases');
    purchasesSheet.columns = [
      { header: 'Purchase ID', key: 'id', width: 40 },
      { header: 'Buyer Name', key: 'buyerName', width: 20 },
      { header: 'Raffler Name', key: 'rafflerName', width: 20 },
      { header: 'Ticket Count', key: 'ticketCount', width: 15 },
      { header: 'Price Per Ticket', key: 'pricePerTicket', width: 18 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Ticket Range', key: 'ticketRange', width: 15 },
      { header: 'Purchase Date', key: 'createdAt', width: 22 },
    ];

    const purchases = purchaseRepository.findByEntityId(entityId);
    purchases.forEach(purchase => {
      purchasesSheet.addRow({
        id: purchase.id,
        buyerName: purchase.buyerName,
        rafflerName: purchase.rafflerName,
        ticketCount: purchase.ticketCount,
        pricePerTicket: purchase.pricePerTicket,
        totalPrice: purchase.totalPrice,
        ticketRange: `${purchase.startTicketNumber}-${purchase.endTicketNumber}`,
        createdAt: purchase.createdAt.toISOString(),
      });
    });

    purchasesSheet.getRow(1).font = { bold: true };
    purchasesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    purchasesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Summary
    const totalRevenue = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalTickets = purchases.reduce((sum, p) => sum + p.ticketCount, 0);

    infoSheet.addRow({ property: '', value: '' });
    infoSheet.addRow({ property: '--- Summary ---', value: '' });
    infoSheet.addRow({ property: 'Total Purchases', value: purchases.length });
    infoSheet.addRow({ property: 'Total Tickets', value: totalTickets });
    infoSheet.addRow({ property: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const exportService = new ExportService();
