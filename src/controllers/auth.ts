import db from "../database/database";
const users = require("../database/models/users")(db);
import { createSessionJWT } from "../util/jwt";

async function logIn(email: string, password: string) {
    const userData = await users.findOne({
        where: { email }
    });

    if (userData === null || userData.dataValues.password !== password) {
        return { loggedIn: false, token: null };
    }

    const token = createSessionJWT({
        id: userData.dataValues.id,
        role: userData.dataValues.role
    });

    return { loggedIn: Boolean(token), token };
}

export default { logIn };
