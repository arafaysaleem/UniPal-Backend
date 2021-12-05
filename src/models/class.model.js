const { DBService } = require('../db/db-service');
const { multipleColumnSet, multipleFilterSet } = require('../utils/common.utils');
const { tables } = require('../utils/tableNames.utils');

class ClassModel {

    findAll = async(filters) => {
        let sql = `
            SELECT 
                CL.class_erp, CL.semester, CL.parent_class_erp, CL.day_1, CL.day_2
                CR.classroom_id, CR.classroom,
                    CP.campus_id, CP.campus,
                S.subject_code, S.subject,
                TR.teacher_id, TR.full_name, TR.average_rating, TR.total_reviews,
                TS1.timeslot_id, TS1.start_time, TS1.end_time, TS1.slot_number,
                TS2.timeslot_id, TS2.start_time, TS2.end_time, TS2.slot_number
            FROM ${tables.Classes} AS CL
            NATURAL JOIN ${tables.Classrooms} AS CR
            NATURAL JOIN ${tables.Campuses} AS CP
            NATURAL JOIN ${tables.Subjects} AS S
            NATURAL JOIN ${tables.Teachers} AS TR
            INNER JOIN ${tables.Timeslots} AS TS1 ON TS1.timeslot_id = CL.timeslot_1
            INNER JOIN ${tables.Timeslots} AS TS2 ON TS2.timeslot_id = CL.timeslot_2
        `;

        if (!Object.keys(filters).length) {
            return await DBService.query(sql);
        }

        const { filterSet, filterValues } = multipleFilterSet(filters);
        sql += ` WHERE ${filterSet}`;

        return await DBService.query(sql, [...filterValues]);
    };

    findOne = async(class_erp) => {
        const sql = `
            SELECT 
                CL.class_erp, CL.semester, CL.parent_class_erp, CL.day_1, CL.day_2
                CR.classroom_id, CR.classroom,
                    CP.campus_id, CP.campus,
                S.subject_code, S.subject,
                TR.teacher_id, TR.full_name, TR.average_rating, TR.total_reviews,
                TS1.timeslot_id, TS1.start_time, TS1.end_time, TS1.slot_number,
                TS2.timeslot_id, TS2.start_time, TS2.end_time, TS2.slot_number
            FROM ${tables.Classes} AS CL
            NATURAL JOIN ${tables.Classrooms} AS CR
            NATURAL JOIN ${tables.Campuses} AS CP
            NATURAL JOIN ${tables.Subjects} AS S
            NATURAL JOIN ${tables.Teachers} AS TR
            INNER JOIN ${tables.Timeslots} AS TS1 ON TS1.timeslot_id = CL.timeslot_1
            INNER JOIN ${tables.Timeslots} AS TS2 ON TS2.timeslot_id = CL.timeslot_2
            WHERE class_erp = ?
            LIMIT 1
        `;

        const result = await DBService.query(sql, [class_erp]);

        return result[0];
    };

    create = async({
        class_erp, semester, classroom_id, subject_code,
        teacher_id, parent_class_erp = null, timeslot_1, timeslot_2, day_1, day_2
    }) => {
        
        const valueSet = {
            class_erp, semester, classroom_id, subject_code,
            teacher_id, parent_class_erp, timeslot_1, timeslot_2, day_1, day_2
        };
        const { columnSet, values } = multipleColumnSet(valueSet);

        const sql = `INSERT INTO ${tables.Classes} SET ${columnSet}`;

        const result = await DBService.query(sql, [...values]);
        const created_class = !result ? 0 : {
            affected_rows: result.affectedRows
        };

        return created_class;
    };

    createMany = async(classesArray) => {

        const sql = `INSERT INTO ${tables.Classes} (
            class_erp, semester, classroom_id, subject_code,
            teacher_id, parent_class_erp, timeslot_1, timeslot_2, day_1, day_2
        ) VALUES ?`;

        const result = await DBService.query(sql, [classesArray]);
        const created_classes = !result ? 0 : {
            affected_rows: result.affectedRows
        };

        return created_classes;
    };

    update = async(columns, erp) => {
        const { columnSet, values } = multipleColumnSet(columns);

        const sql = `UPDATE ${tables.Classes} SET ${columnSet} WHERE class_erp = ?`;

        const result = await DBService.query(sql, [...values, erp]);

        return result;
    };

    delete = async(erp) => {
        const sql = `DELETE FROM ${tables.Classes}
        WHERE class_erp = ?`;
        const result = await DBService.query(sql, [erp]);
        const affectedRows = result ? result.affectedRows : 0;

        return affectedRows;
    };
}

module.exports = new ClassModel;