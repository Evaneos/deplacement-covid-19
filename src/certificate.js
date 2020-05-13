import { PDFDocument, StandardFonts } from 'pdf-lib';
import 'bootstrap/dist/css/bootstrap.min.css';

import './main.css';
import './check-updates';
import './icons';
import pdfBase from './certificate.pdf';

function getFormData(form) {
    const data = new FormData(form);
    return Array.from(data).reduce((entries, entry) => {
        return { ...entries, [entry[0]]: entry };
    }, {});
}

async function getDocumentTemplate() {
    const existingPdfBytes = await fetch(pdfBase).then((res) =>
        res.arrayBuffer()
    );
    return PDFDocument.load(existingPdfBytes);
}

async function generateVoucherPdf(formData) {
    const now = new Date();
    const creationDate = now.toLocaleDateString('en-US');
    const creationHour = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const pdfDoc = await getDocumentTemplate();
    const page1 = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const drawText = (text, x, y, size = 11) => {
        page1.drawText(text, { x, y, size, font });
    };

    drawText('Generated at:', 464, 150, 7);
    drawText(`${creationDate}, ${creationHour}`, 455, 144, 7);

    const pdfBytes = await pdfDoc.save();

    return new Blob([pdfBytes], { type: 'application/pdf' });
}

function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
}

function notifyDownload() {
    const snackbar = document.getElementById('snackbar');
    snackbar.classList.remove('d-none');
    setTimeout(() => snackbar.classList.add('show'), 100);

    setTimeout(function () {
        snackbar.classList.remove('show');
        setTimeout(() => snackbar.classList.add('d-none'), 500);
    }, 6000);
}

const form = document.getElementById('information');
form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();

    const creationInstant = new Date();
    const creationDate = creationInstant.toLocaleDateString('en-US');
    const creationHour = creationInstant.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const pdfBlob = await generateVoucherPdf(getFormData());
    downloadBlob(pdfBlob, `voucher-${creationDate}_${creationHour}.pdf`);
    notifyDownload();
});
