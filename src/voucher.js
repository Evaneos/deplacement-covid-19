import './check-updates';
import './icons';
import './main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { sprintf } from 'sprintf-js';

import FRA from './FRA.txt';

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

async function drawLogo(pdf, page, logo) {
    if (logo instanceof File === false) {
        return;
    }

    let embedMethod;
    switch (logo.type) {
        case 'image/png':
            embedMethod = 'embedPng';
            break;
        case 'image/jpg':
            embedMethod = 'embedJpeg';
            break;
    }
    const buffer = await logo.arrayBuffer();
    const embeddedLogo = await pdf[embedMethod](buffer);

    // const { height, width } = embeddedLogo;

    page.drawImage(embeddedLogo, {
        x: 60,
        y: 60,
        scale,
    });
}

async function generateVoucherPdf(formData, creationDate) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const margin = 60;

    if (formData.logo instanceof File) {
        await drawLogo(pdf, page, formData.logo);
    }

    page.moveTo(margin, page.getHeight() - margin);
    const text = sprintf(template, { ...formData, creationDate }).replace(
        /\n/g,
        ' \n'
    );

    page.drawText(text, {
        maxWidth: page.getWidth() - margin * 2,
        size: 12,
        lineHeight: 15,
        font,
    });

    const pdfBytes = await pdf.save();

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
    const pdfBlob = await generateVoucherPdf(formData, creationDate);
    downloadBlob(pdfBlob, `voucher-${creationDate}_${creationHour}.pdf`);
    notifyDownload();
});
