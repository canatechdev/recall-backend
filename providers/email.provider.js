// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// });

// exports.sendEmail = async (to, subject, text,html) => {
//     const info = await transporter.sendMail({
//         from: process.env.EMAIL,
//         to,
//         subject,
//         text,
//         html
//     });

//     console.log("Message sent:", info.messageId);
// }

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "sitsolutions2017@gmail.com",
        pass: "trkyyvhbjsfysjbq", // NO spaces
    },
});

exports.sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"App" <sitsolutions2017@gmail.com>`,
            to,
            subject,
            text,
            html,
        });

        console.log("sent:", info.messageId);
    } catch (err) {
        console.error(err);
    }
};