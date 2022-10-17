const settingModel = require("../models/setting");
const { rytrmeLog } = require("../services/logger");
const { get } = require("lodash");
const dvAxios = require("devergroup-request").default;
const axios = new dvAxios({
    axiosOpt: {
        timeout: 30000
    }
});

const login = async (req, res) => {
    let { email, password, fp } = req.body;
    try {
        let body = JSON.stringify({
            operation: "userAuthEmail",
            params: {
                email,
                otp: "",
                password: "",
                name: ""
            }
        });
        response = await axios.instance.post(
            "https://api.rytr.me",
            body,
            {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                    "content-type": "application/json; charset=UTF-8",
                    "content-length": Buffer.byteLength(body),
                }
            }
        );
        if (response && response.data && response.data.success) {
            body = JSON.stringify({
                operation: "userAuthLogin",
                params: {
                    email,
                    password,
                    fp,
                    otp: "",
                    name: ""
                }
            });
            let { data } = await axios.instance.post(
                "https://api.rytr.me",
                body, 
                {
                    headers: {
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                        "content-type": "application/json; charset=UTF-8",
                        "content-length": Buffer.byteLength(body),
                    }
                }
            );
            if (data && data.success) {
                await settingModel.findOneAndUpdate(null, {
                    rytrmeCookie: JSON.stringify({
                        token: data.data.token,
                        user: data.data.user
                    })
                }, {
                    upsert: true
                });
                rytrmeLog.info(`Start session with ${email} successfully.`);
                res.send("Login successfully.");
            } else {
                rytrmeLog.error(`Start session with ${email} failed`);
                res.status(500).send('Credential is incorrect.');
            }
        } else {
            rytrmeLog.error(`Start session with ${email} failed`);
            res.status(500).send('Credential is incorrect.');
        }
    } catch (err) {
        sistrixLog.error(`Start session with ${email} failed: ${get(err, "response.data.message") || err.toString()}`);
        res.status(500).send(get(err, "response.data.message") || err.toString());
    }
}

module.exports = {
    login
};