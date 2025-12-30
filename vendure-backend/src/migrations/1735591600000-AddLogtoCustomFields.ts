import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLogtoCustomFields1735591600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "customer" 
            ADD COLUMN IF NOT EXISTS "customFieldsLogtouserid" character varying,
            ADD COLUMN IF NOT EXISTS "customFieldsLogtodata" text
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_customer_customFieldsLogtouserid" 
            ON "customer" ("customFieldsLogtouserid")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_customFieldsLogtouserid"`);
        await queryRunner.query(`
            ALTER TABLE "customer" 
            DROP COLUMN IF EXISTS "customFieldsLogtouserid",
            DROP COLUMN IF EXISTS "customFieldsLogtodata"
        `);
    }
}
