"use strict"

const deputyDB = require(".././../models/deputySecratery/deputySecretaryDetails");
const deskOfficeDB = require('.././../models/deskOfficer/deskOfficerDetails');
const nodemailer = require('nodemailer');
const config = require('../../config/config')
const exec = require('child_process').exec;
const invoke = require('../../fabcar/javascript/invoke')
const { key_gen } = require('../key_generator')
const query = require('../../fabcar/javascript/query')

const {template}  = require('../../email_template/htmlTemplate')
var log4js = require('log4js');
var log = log4js.getLogger("app");

module.exports = {
    onBoardUser: onBoardUser
}

function onBoardUser(req, res) {
    return new Promise(async (resolve, reject) => {

        var transporter = nodemailer.createTransport({
            host: config.mail_service,
            port:config.port,
            auth: {
                user: config.mail_id,
                pass: config.mail_password
            }
        });

        console.log(req);
        var user_type = req.user_type;
        var nationality = req.nationality;
        var first_name = req.first_name;
        var middle_name = req.middle_name;
        var last_name = req.last_name;
        var phone_number = req.phone_number;
        var email_id = req.email_id;
        var password = req.password;

        console.log(req);

        if (user_type == "deskofficer") {
            const userObj = new deskOfficeDB(req);

            await userObj.save(function (error) {
                if (error) {
                    if (error.code == 11000) {
                        return resolve({
                            "message": "This email id is already registered with us."
                        })
                    }
                }
                else {
                    const subject = "DeskOfficer Registration";
                    const name = first_name;
                    const body = `You have successfully logged in to MahaIT’s BlockChain Driven Certificate cum
                    Document Authentication Application. Your password is ${res}`;
                    transporter.sendMail({
                        from: config.mail_id,
                        to: req.email_id,
                        subject: subject,
                        html:template(subject, name, body)
                    },
                        function (error, info) {
                            if (error) {
                                console.log(error)
                                log.info("Email failed", error);
                            }
                            else {
                                console.log("Email sent: " + info.response);
                                log.info('Email send: ' + info.response);
                            }
                        })
                    return resolve({
                        "message": "success",
                    })
                }
            })
        }
        else {

            let keys = await key_gen()
            req['publicKey'] = keys.publicKey
            req['privateKey'] = keys.privateKey
            const userObj = new deputyDB(req)

            await userObj.save(async function (error) {
                console.log(error)
                if (error) {
                    if (error.code == 11000) {
                        return resolve({
                            "message": "This email id is already registered with us."
                        })
                    }
                }
                else {

                    let key = "pkregistry"
                    let sendData = {
                        pub: keys.publicKey,
                        owner: req['first_name'],
                        designation: 'Deputy Secretary',
                        email_id: req['email_id']
                    }

                    let queryResult = await query.main('pkregistry')
                    console.log("queryResult", queryResult);
                    let data = []
                    // if(queryResult.includes('does not exist')){
                    //      data = [sendData]
                    // }
                    try{
                        data = JSON.parse(queryResult);
                        data.push(sendData)
                    }
                    catch(e){
                        data = [sendData]
                    }
                    // if (typeof(queryResult) === "string") {
                    //     console.log("addes_as_new")
                    //     data = [sendData]
                    // }
                    // else {
                    //     console.log("come_to_else")
                    //     data = JSON.parse(queryResult)
                    //     data.push(sendData)
                    // }

                    let result = await invoke.main(key, data)
                    let chk = result.toString('utf8')
                    // console.log("result", JSON.parse(chk))
                    const subject = "Deputy Secretary Registration";
                    const name = first_name;
                    const body = `You have successfully logged in to MahaIT’s BlockChain Driven Certificate cum
                    Document Authentication Application. Your password is ${res}`;
                    transporter.sendMail({
                        from: config.mail_id,
                        to: req.email_id,
                        subject: subject,
                        html:template(subject, name, body)
                    },
                        function (error, info) {
                            if (error) {
                                console.log(error);
                                log.info("Email failed", error);
                            }
                            else {
                                console.log("Email sent: " + info.response);
                                log.info('Email send: ' + info.response);
                            }
                        })
                    return resolve({
                        "message": "success",
                    })
                }
            })
        }
    })
}