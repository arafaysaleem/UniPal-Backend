const { DBService } = require('../db/db-service');
const { multipleColumnSet, multipleFilterSet } = require('../utils/common.utils');
const { tables } = require('../utils/tableNames.utils');
const { ConnectionStatus } = require('../utils/enums/connectionStatus.utils');

class StudentConnectionModel {

    findAllRequests = async(filters) => {
        let sql = `
        SELECT 
            student_connection_id, connection_status, sent_at,
            SENDER.erp, SENDER.first_name, SENDER.last_name, SENDER.profile_picture_url, SENDER.program_id, SENDER.graduation_year,
            RECEIVER.erp, RECEIVER.first_name, RECEIVER.last_name, RECEIVER.profile_picture_url, RECEIVER.program_id, RECEIVER.graduation_year
        FROM ${tables.StudentConnections} AS student_connection
        INNER JOIN ${tables.Students} AS sender ON student_connection.sender_erp = SENDER.erp
        INNER JOIN ${tables.Students} AS receiver ON student_connection.receiver_erp = RECEIVER.erp
        WHERE connection_status = ?`;

        if (!Object.keys(filters).length) {
            return await DBService.query(sql, [ConnectionStatus.RequestPending], { nestTables: true });
        }

        const { filterSet, filterValues } = multipleFilterSet(filters);
        sql += ` AND ${filterSet}`;

        return await DBService.query(sql, [ConnectionStatus.RequestPending, ...filterValues], { nestTables: true });
    };

    findAll = async({erp}) => {
        let sql = `SELECT 
            student_connection_id, connection_status, sent_at, accepted_at,
            SENDER.erp, SENDER.first_name, SENDER.last_name, SENDER.profile_picture_url, SENDER.program_id, SENDER.graduation_year,
            RECEIVER.erp, RECEIVER.first_name, RECEIVER.last_name, RECEIVER.profile_picture_url, RECEIVER.program_id, RECEIVER.graduation_year
        FROM ${tables.StudentConnections} AS student_connection
        INNER JOIN ${tables.Students} AS sender ON student_connection.sender_erp = SENDER.erp
        INNER JOIN ${tables.Students} AS receiver ON student_connection.receiver_erp = RECEIVER.erp
        WHERE connection_status = ? AND (sender_erp = ? OR receiver_erp = ?)`;

        return await DBService.query(sql, [ConnectionStatus.Friends, erp, erp], { nestTables: true });
    };

    findOne = async(id) => {
        const sql = `SELECT
            student_connection_id, connection_status, sent_at, accepted_at,
            SENDER.erp, SENDER.first_name, SENDER.last_name, SENDER.profile_picture_url, SENDER.program_id, SENDER.graduation_year,
            RECEIVER.erp, RECEIVER.first_name, RECEIVER.last_name, RECEIVER.profile_picture_url, RECEIVER.program_id, RECEIVER.graduation_year
        FROM ${tables.StudentConnections} AS student_connection
        INNER JOIN ${tables.Students} AS sender ON student_connection.sender_erp = SENDER.erp
        INNER JOIN ${tables.Students} AS receiver ON student_connection.receiver_erp = RECEIVER.erp    
        WHERE student_connection_id = ?
        LIMIT 1`;

        const result = await DBService.query(sql, [id], { nestTables: true });

        return result[0];
    };

    create = async({ sender_erp, receiver_erp, sent_at }) => {
        const valueSet = { sender_erp, receiver_erp, sent_at };
        const { columnSet, values } = multipleColumnSet(valueSet);

        const sql = `INSERT INTO ${tables.StudentConnections} SET ${columnSet},
        student_1_erp = LEAST(?,?),
        student_2_erp = GREATEST(?,?)`;

        const result = await DBService.query(sql, [...values, sender_erp, receiver_erp, sender_erp, receiver_erp]);
        const created_connection_request = !result ? 0 : {
            student_connection_id: result.insertId,
            affected_rows: result.affectedRows
        };

        return created_connection_request;
    };

    update = async({ connection_status, accepted_at = null }, id) => {
        const columns = { connection_status, accepted_at };
        const { columnSet, values } = multipleColumnSet(columns);

        const sql = `UPDATE ${tables.StudentConnections} SET ${columnSet} WHERE student_connection_id = ?`;

        const result = await DBService.query(sql, [...values, id]);

        return result;
    };

    delete = async(id) => {
        const sql = `DELETE FROM ${tables.StudentConnections} WHERE student_connection_id = ?`;

        const result = await DBService.query(sql, [id]);
        const affectedRows = result ? result.affectedRows : 0;

        return affectedRows;
    };
}

module.exports = new StudentConnectionModel;