import { PDFDocument, StandardFonts } from 'pdf-lib';
import 'bootstrap/dist/css/bootstrap.min.css';

import './main.css';
import './check-updates';
import './icons';

import FRA from './FRA.txt';
import { sprintf } from 'sprintf-js';

let template;
const client = new XMLHttpRequest();
client.open('GET', FRA);
client.onreadystatechange = function () {
    template = client.responseText;
};
client.send();

function getFormData(form) {
    const data = new FormData(form);
    return Array.from(data).reduce(
        (entries, entry) => {
            return { ...entries, [entry[0].replace(/-/g, '_')]: entry[1] };
        },
        { creation_date: new Date().toLocaleDateString('en-US') }
    );
}

async function generateVoucherPdf(formData, creationDate) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 60;

    page.moveTo(margin, page.getHeight() - margin);

    const text = sprintf(template, { ...formData, creationDate }).replace(/\n/g, ' \n')

    page.drawText(text, {
        maxWidth: page.getWidth() - margin * 2,
        size: 12,
        lineHeight: 15,
        font
    });

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

    const formData = getFormData(submitEvent.target);
    console.log(formData);

    const pdfBlob = await generateVoucherPdf(formData, creationDate);
    downloadBlob(pdfBlob, `voucher-${creationDate}_${creationHour}.pdf`);
    notifyDownload();
});
