import db from "../database/database";
import { NewUserData } from "../util/objects";
import { hash } from "bcrypt";

const { Op } = require("sequelize");
const sqlz = require("sequelize").Sequelize;
const user = require("../database/models/users")(db);
const businessUnits = require("../database/models/payments_periods")(db);

function getOrder(order: string, by: string) {
    switch (order) {
        case "name": return [
            ["first_name", by],
            ["last_name", by]
        ];
        case "salary": return [
            ["salary", by]
        ];
        default: return [];
    }
}

function createUnitsListCondition(businessUnits: Array<number>) {
    const unitsList = [{ "business_unit.business_unit_ids": `[${String(businessUnits).replace(/,/g, ", ")}]` }];

    for (const i in businessUnits) {
        unitsList.push({ "business_unit.business_unit_ids": `[${businessUnits[parseInt(i)]}]` });
    }

    return unitsList;
}

export async function checkIfEmailExists(email: string) {
    let status;
    try {
        status = await user.findOne({
            where: { email }
        });

    } catch (error) {
        return false;
    }

    return status;
}

export async function getUsersList(order: string, by: string, businessUnits?: Array<number>): Promise<{ successful: boolean; userList: object[] | undefined; }> {
    let userList;
    const attributesList = [
        "id",
        "first_name",
        "last_name",
        ["payment_period_id", "payment_period"],
        [sqlz.json("business_unit.business_unit_ids"), "business_units"],
        "on_leave",
        "salary"
    ];
    const orderSet = getOrder(order, by);

    if (businessUnits === undefined) {
        try {
            userList = await user.findAll({
                attributes: attributesList,
                order: orderSet
            });

            return { successful: true, userList };

        } catch (error) {
            return { successful: false, userList: undefined };
        }
    }

    try {
        const unitsList = createUnitsListCondition(businessUnits);

        userList = await user.findAll({
            attributes: attributesList,
            where: {
                [Op.or]: unitsList,
                id: {
                    [Op.ne]: 1
                }
            },
            order: orderSet
        });

        return { successful: true, userList };

    } catch {
        return { successful: false, userList: undefined };
    }
}

export async function getUserDetails(id: number, businessUnits?: Array<number>): Promise<{ successful: boolean; found: boolean; userDetails: object | undefined; }> {
    let userDetails;
    const attributesList = [
        "first_name",
        "second_name",
        "last_name",
        "second_last_name",
        "email",
        "role",
        ["payment_period_id", "payment_period"],
        [sqlz.json("business_unit.business_unit_ids"), "business_units"],
        "on_leave",
        "active",
        "salary"
    ];

    let condition;
    try {
        if (businessUnits) {
            const unitsList = createUnitsListCondition(businessUnits);
            condition = { id, [Op.or]: unitsList };

        } else {
            condition = { id };
        }

        userDetails = await user.findOne({
            attributes: attributesList,
            where: condition
        });

    } catch (error) {
        return { successful: false, found: false, userDetails: undefined };
    }

    return { successful: true, found: userDetails !== null, userDetails };
}

export async function createNewUser(userData: NewUserData, password: string) {
    try {
        await user.create({
            ...userData,
            business_unit: { business_unit_ids: [userData.business_unit] },
            on_leave: false,
            active: true,
            payment_period_id: userData.payment_period_id,
            privileges: { privileges: [1] },
            password: await hash(password, 10)
        });
    } catch {
        return { successful: false };
    }

    return { successful: true };
}

export async function editUser(id: number, userData: Partial<NewUserData>, businessUnits?: Array<number>) {
    let result;
    let condition;

    if (businessUnits) {
        const unitsList = createUnitsListCondition(businessUnits);
        condition = { id, [Op.or]: unitsList };

    } else {
        condition = { id };
    }

    try {
        result = await user.update({
            ...userData,
            ...(userData.business_unit && { business_unit: { business_unit_ids: [userData.business_unit] } })
        }, { where: condition });

    } catch {
        return { successful: false, found: false };
    }

    return { successful: true, found: result[0] === 1 };
}

// No use of paranoid?
export async function pseudoDeleteUser(id: number, businessUnits?: Array<number>) {
    let result;
    let condition;

    if (businessUnits) {
        const unitsList = createUnitsListCondition(businessUnits);
        condition = { id, [Op.or]: unitsList };

    } else {
        condition = { id };
    }

    try {
        result = await user.update({ active: false }, {
            where: condition
        });
        console.log(result);

    } catch (error) {
        return { successful: false, found: false };
    }

    return { successful: true, found: result[0] === 1 };
}

// Alphanumeric
export async function generatePassword(length: number) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function getPaymentPeriods() {
    let businessUnitData;

    try {
        businessUnitData = await businessUnits.findAll();

    } catch (error) {
        return false;
    }

    return businessUnitData;
}
