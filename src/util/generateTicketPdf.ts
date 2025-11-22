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
  const left = 40;
  let y = 50;

  doc.setFontSize(18);
  doc.text(data.airlineName || 'Airline', left, y);
  doc.setFontSize(12);
  if (data.numeroBillet) doc.text(`Ticket: ${data.numeroBillet}`, 430, y);
  y += 30;

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(left, y, 555, y);
  y += 20;

  doc.setFontSize(11);
  doc.text(`Booking Ref: ${data.bookingReference}`, left, y);
  if (data.dateEmission) doc.text(`Issued: ${new Date(data.dateEmission).toLocaleString()}`, 350, y);
  y += 24;

  doc.setFontSize(12);
  doc.text('Passenger', left, y);
  doc.setFontSize(11);
  doc.text(`${data.passengerFirstName} ${data.passengerLastName}`, left + 80, y);
  y += 20;

  if (data.passengerPassport) {
    doc.setFontSize(11);
    doc.text(`Passport: ${data.passengerPassport}`, left + 80, y);
    y += 18;
  }

  doc.setFontSize(12);
  doc.text('Flight', left, y);
  doc.setFontSize(11);
  doc.text(`${data.flightNumber} ${data.flightClass ? `(${data.flightClass})` : ''}`, left + 80, y);
  y += 18;

  doc.setFontSize(12);
  doc.text('From', left, y);
  doc.setFontSize(11);
  doc.text(`${data.departureAirportCode || ''} — ${data.departureAirportName || ''} (${data.departureCity || ''})`, left + 80, y);
  if (data.departureTime) doc.text(new Date(data.departureTime).toLocaleString(), 350, y);
  y += 18;

  doc.setFontSize(12);
  doc.text('To', left, y);
  doc.setFontSize(11);
  doc.text(`${data.arrivalAirportCode || ''} — ${data.arrivalAirportName || ''} (${data.arrivalCity || ''})`, left + 80, y);
  if (data.arrivalTime) doc.text(new Date(data.arrivalTime).toLocaleString(), 350, y);
  y += 30;

  doc.setFontSize(11);
  if (data.flightClass) doc.text(`Class: ${data.flightClass}`, left, y);
  if (typeof data.totalPrice === 'number') doc.text(`Total: ${data.totalPrice.toFixed(2)} MAD`, 350, y);
  y += 40;

  doc.setFontSize(10);
  doc.text('This is a generated ticket copy. The official ticket may be delivered by email.', left, y);

  const outFilename = filename || `ticket-${data.numeroBillet || Date.now()}.pdf`;
  const auto = options?.autoDownload ?? true;
  if (auto) {
    doc.save(outFilename);
    return;
  }

  // return blob for preview
  const blob = doc.output('blob');
  return blob;
}
