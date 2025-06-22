"""Add Phase 2 models: documents, declaration templates, and template fields

Revision ID: 20250622_0848
Revises: b87287d21e67
Create Date: 2025-06-22 08:48:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250622_0848'
down_revision = 'b87287d21e67'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create declaration_templates table
    op.create_table('declaration_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_declaration_templates_id'), 'declaration_templates', ['id'], unique=False)

    # Create template_fields table
    op.create_table('template_fields',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('field_name', sa.String(), nullable=False),
        sa.Column('label_ru', sa.String(), nullable=False),
        sa.Column('extraction_rules', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['declaration_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_template_fields_id'), 'template_fields', ['id'], unique=False)

    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shipment_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.Enum('INVOICE', 'PACKING_LIST', 'CERTIFICATE_OF_QUALITY', 'CUSTOMS_DECLARATION', 'BILL_OF_LADING', 'ORIGIN_CERTIFICATE', name='documenttype'), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('storage_path', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('UPLOADED', 'PROCESSING', 'COMPLETED', 'ERROR', name='documentstatus'), nullable=True),
        sa.Column('extracted_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    op.drop_index(op.f('ix_template_fields_id'), table_name='template_fields')
    op.drop_table('template_fields')
    op.drop_index(op.f('ix_declaration_templates_id'), table_name='declaration_templates')
    op.drop_table('declaration_templates')