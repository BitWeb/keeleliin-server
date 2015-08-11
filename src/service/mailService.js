var config = require(__base + 'config');
var nodemailer = require('nodemailer');

function MailService() {
    var self = this;

    this._transporter = null;

    this._getTransporter = function() {
        if (self._transporter == null) {
            self._transporter = nodemailer.createTransport(config.mail.transporterOptions);
        }

        return self._transporter;
    };

    this.sendMail = function(mailOptions, callback) {
        if (config.mail.sendAllMailsTo.length > 0) {
            mailOptions.to = config.mail.sendAllMailsTo;
            mailOptions.cc = [];
            mailOptions.bcc = [];
        }
        self._getTransporter().sendMail(mailOptions, function(error, info) {
            if (error) {
                return callback(error);
            }
            return callback(null, info.response);
        });
    };
}

module.exports = new MailService();