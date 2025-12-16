import { jsPDF } from 'jspdf';

export type TicketPdfData = {
  numeroBillet: string;
  dateEmission?: string | Date;
  bookingReference: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerPassport?: string;
  passengerDateOfBirth?: string | Date;
  flightNumber: string;
  airlineName?: string;
  departureAirportCode?: string;
  departureAirportName?: string;
  departureCity?: string;
  departureTime?: string | Date;
  arrivalAirportCode?: string;
  arrivalAirportName?: string;
  arrivalCity?: string;
  arrivalTime?: string | Date;
  flightClass?: string;
  totalPrice?: number;
};

export default async function generateTicketPdf(
  data: TicketPdfData,
  filename?: string,
  options?: { autoDownload?: boolean }
): Promise<Blob | void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = 595;
  const pageHeight = 842;

  // Color palette - Modern gradient blues and purples
  const primaryColor = [102, 126, 234]; // #667eea
  const accentColor = [118, 75, 162]; // #764ba2
  const darkText = [31, 41, 55]; // #1f2937
  const lightText = [107, 114, 128]; // #6b7280
  const lightBg = [249, 250, 251]; // #f9fafb

  // === HEADER SECTION WITH GRADIENT ===
  // Create gradient effect with overlapping rectangles
  for (let i = 0; i < 20; i++) {
    const opacity = 1 - (i * 0.05);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setGState(doc.GState({ opacity }));
    doc.rect(0, i * 8, pageWidth, 8, 'F');
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // Airline name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(data.airlineName || 'AIRLINE', 40, 60);

  // Ticket number badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 180, 35, 140, 35, 8, 8, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TICKET #', pageWidth - 170, 52);
  doc.setFontSize(12);
  doc.text(data.numeroBillet || 'N/A', pageWidth - 170, 65);

  // === BOARDING PASS CARD ===
  const cardTop = 120;
  const cardHeight = 520;
  
  // Main white card with shadow effect
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(35, cardTop + 5, pageWidth - 70, cardHeight, 0, 0, 'F'); // Shadow
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(30, cardTop, pageWidth - 60, cardHeight, 12, 12, 'F');

  let yPos = cardTop + 40;

  // === BOOKING REFERENCE SECTION ===
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(50, yPos - 5, pageWidth - 100, 65, 8, 8, 'F');
  
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('BOOKING REFERENCE', 65, yPos + 10);
  
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.bookingReference, 65, yPos + 35);

  // Issue date on right
  if (data.dateEmission) {
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ISSUED', pageWidth - 180, yPos + 10, { align: 'right' });
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(data.dateEmission).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    }), pageWidth - 180, yPos + 28, { align: 'right' });
  }

  yPos += 85;

  // === PASSENGER INFORMATION ===
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PASSENGER', 65, yPos);
  yPos += 18;

  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.passengerFirstName.toUpperCase()} ${data.passengerLastName.toUpperCase()}`, 65, yPos);
  yPos += 25;

  // Passport & DOB in two columns
  if (data.passengerPassport || data.passengerDateOfBirth) {
    const col1X = 65;
    const col2X = 300;
    
    if (data.passengerPassport) {
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('PASSPORT', col1X, yPos);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(data.passengerPassport, col1X, yPos + 13);
    }

    if (data.passengerDateOfBirth) {
      doc.setTextColor(lightText[0], lightText[1], lightText[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('DATE OF BIRTH', col2X, yPos);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(new Date(data.passengerDateOfBirth).toLocaleDateString(), col2X, yPos + 13);
    }
    yPos += 35;
  }

  // Decorative line
  doc.setDrawColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setLineWidth(1);
  doc.line(50, yPos, pageWidth - 50, yPos);
  yPos += 30;

  // === FLIGHT DETAILS - HORIZONTAL LAYOUT ===
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FLIGHT DETAILS', 65, yPos);
  yPos += 25;

  // Departure column
  const depX = 65;
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FROM', depX, yPos);
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(data.departureAirportCode || 'XXX', depX, yPos + 35);
  
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.departureCity || '', depX, yPos + 52);
  
  if (data.departureTime) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(data.departureTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: false 
    }), depX, yPos + 70);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(data.departureTime).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    }), depX, yPos + 85);
  }

  // Arrow in the middle
  const arrowY = yPos + 30;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.line(220, arrowY, 320, arrowY);
  // Arrow head
  doc.line(320, arrowY, 310, arrowY - 6);
  doc.line(320, arrowY, 310, arrowY + 6);
  
  // Flight number above arrow
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.flightNumber, 270, arrowY - 10, { align: 'center' });

  // Arrival column
  const arrX = 380;
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TO', arrX, yPos);
  
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(data.arrivalAirportCode || 'XXX', arrX, yPos + 35);
  
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.arrivalCity || '', arrX, yPos + 52);
  
  if (data.arrivalTime) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(data.arrivalTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: false 
    }), arrX, yPos + 70);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(data.arrivalTime).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    }), arrX, yPos + 85);
  }

  yPos += 115;

  // Decorative line
  doc.setDrawColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.line(50, yPos, pageWidth - 50, yPos);
  yPos += 30;

  // === CLASS AND PRICE INFO ===
  const infoBoxY = yPos;
  const infoBoxHeight = 60;

  // Class info box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(65, infoBoxY, 200, infoBoxHeight, 6, 6, 'F');
  
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CLASS', 80, infoBoxY + 20);
  
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.flightClass || 'Economy', 80, infoBoxY + 42);

  // Price info box
  if (typeof data.totalPrice === 'number') {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(285, infoBoxY, 200, infoBoxHeight, 6, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL PRICE', 300, infoBoxY + 20);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.totalPrice.toFixed(2)} MAD`, 300, infoBoxY + 44);
  }

  yPos += infoBoxHeight + 40;

  // === QR CODE PLACEHOLDER ===
  // Draw QR code box
  const qrSize = 80;
  const qrX = (pageWidth - qrSize) / 2;
  doc.setFillColor(darkText[0], darkText[1], darkText[2]);
  doc.roundedRect(qrX, yPos, qrSize, qrSize, 4, 4, 'F');
  
  // QR pattern simulation
  doc.setFillColor(255, 255, 255);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (Math.random() > 0.5) {
        doc.rect(qrX + 5 + i * 8.5, yPos + 5 + j * 8.5, 7, 7, 'F');
      }
    }
  }

  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SCAN FOR BOARDING', pageWidth / 2, yPos + qrSize + 15, { align: 'center' });

  // === FOOTER ===
  yPos = cardTop + cardHeight + 25;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(30, yPos, pageWidth - 60, 80, 8, 8, 'F');

  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('IMPORTANT INFORMATION', 50, yPos + 20);
  
  doc.setFontSize(8);
  const footerText = 'Please arrive at the airport at least 2 hours before departure. Valid ID and boarding pass required. This is an electronically generated ticket. For assistance, contact our customer service.';
  const splitText = doc.splitTextToSize(footerText, pageWidth - 100);
  doc.text(splitText, 50, yPos + 35);

  // === OUTPUT ===
  const outFilename = filename || `ticket-${data.numeroBillet || Date.now()}.pdf`;
  const auto = options?.autoDownload ?? true;
  
  if (auto) {
    doc.save(outFilename);
    return;
  }

  const blob = doc.output('blob');
  return blob;
}