import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CDropdown,
    CDropdownMenu,
    CDropdownToggle,
    CPagination,
    CPaginationItem,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilCloudDownload } from '@coreui/icons'

const ThemedTablePage = ({
    tabs,
    activeTabKey,
    onTabChange,
    actions,
    columns,
    rows,
    rowKey,
    rowExpansion,
    getRowClassName,
    loading,
    emptyText,
    topContent,
    footerLeft,
    pagination,
    tableClassName,
}) => {
    const resolvedRowKey = rowKey || ((row) => row?.id)

    const getPageItems = (page, totalPages) => {
        if (!totalPages || totalPages < 1) return []

        if (totalPages <= 15) {
            return Array.from({ length: totalPages }, (_, idx) => idx + 1)
        }

        const clampedPage = Math.min(Math.max(page || 1, 1), totalPages)
        const items = [1]

        const start = Math.max(2, clampedPage - 1)
        const end = Math.min(totalPages - 1, clampedPage + 1)

        if (start > 2) items.push('ellipsis-left')
        for (let p = start; p <= end; p += 1) items.push(p)
        if (end < totalPages - 1) items.push('ellipsis-right')

        items.push(totalPages)
        return items
    }

    return (
        <div>
            <CRow className="mb-3 align-items-center">
                <CCol xs={12} md={8} className="mb-3 mb-md-0">
                    {tabs?.length ? (
                        <div className="bg-light rounded-pill p-1 d-inline-flex gap-1 flex-wrap">
                            {tabs.map((tab) => {
                                const isActive = tab.key === activeTabKey
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={classNames(
                                            'btn btn-sm rounded-pill px-3',
                                            isActive ? 'bg-white shadow-sm' : 'btn-light bg-transparent',
                                        )}
                                        onClick={() => onTabChange?.(tab.key)}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}
                </CCol>

                <CCol
                    xs={12}
                    md={4}
                    className="d-flex justify-content-start justify-content-md-end gap-2"
                >
                    {actions?.filtersContent ? (
                        <CDropdown alignment="end">
                            <CDropdownToggle color="light">
                                <CIcon icon={cilFilter} className="me-2" />
                                {actions.filtersLabel || 'Filters'}
                            </CDropdownToggle>
                            <CDropdownMenu className="p-3" style={{ minWidth: 280 }}>
                                {actions.filtersContent}
                            </CDropdownMenu>
                        </CDropdown>
                    ) : (
                        <CButton
                            color="light"
                            disabled={!actions?.onFilters}
                            onClick={actions?.onFilters}
                        >
                            <CIcon icon={cilFilter} className="me-2" />
                            {actions?.filtersLabel || 'Filters'}
                        </CButton>
                    )}

                    <CButton
                        color="light"
                        disabled={!actions?.onExport}
                        onClick={actions?.onExport}
                    >
                        <CIcon icon={cilCloudDownload} className="me-2" />
                        {actions?.exportLabel || 'Export'}
                    </CButton>

                    {actions?.primary ? (
                        <CButton
                            color={actions.primary.color || 'success'}
                            disabled={actions.primary.disabled}
                            onClick={actions.primary.onClick}
                        >
                            {actions.primary.icon ? (
                                <span className="me-2">{actions.primary.icon}</span>
                            ) : null}
                            {actions.primary.label}
                        </CButton>
                    ) : null}
                </CCol>
            </CRow>

            <CCard className="mb-4 border-0">
                <CCardBody>
                    {topContent}

                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary" />
                        </div>
                    ) : (
                        <CTable
                            align="middle"
                            className={classNames('mb-0', tableClassName)}
                            hover
                            responsive
                        >
                            <CTableHead>
                                <CTableRow className="border-bottom">
                                    {columns.map((col) => (
                                        <CTableHeaderCell
                                            key={col.key}
                                            className={classNames(
                                                'text-uppercase text-medium-emphasis',
                                                col.headerClassName,
                                            )}
                                            style={col.headerStyle}
                                        >
                                            {col.label}
                                        </CTableHeaderCell>
                                    ))}
                                </CTableRow>
                            </CTableHead>

                            <CTableBody>
                                {rows?.length ? (
                                    rows.flatMap((row) => {
                                        const baseKey = resolvedRowKey(row)
                                        const isExpanded = Boolean(rowExpansion?.isExpanded?.(row))
                                        const baseRow = (
                                            <CTableRow
                                                key={baseKey}
                                                className={classNames('border-bottom', getRowClassName?.(row))}
                                            >
                                                {columns.map((col) => (
                                                    <CTableDataCell
                                                        key={col.key}
                                                        className={col.cellClassName}
                                                        style={col.cellStyle}
                                                    >
                                                        {typeof col.render === 'function' ? col.render(row) : row?.[col.key]}
                                                    </CTableDataCell>
                                                ))}
                                            </CTableRow>
                                        )

                                        if (!isExpanded) return [baseRow]

                                        return [
                                            baseRow,
                                            (
                                                <CTableRow
                                                    key={`${baseKey}__expanded`}
                                                    className={classNames('border-bottom', rowExpansion?.rowClassName)}
                                                >
                                                    <CTableDataCell
                                                        colSpan={columns.length}
                                                        className={rowExpansion?.cellClassName}
                                                        style={rowExpansion?.cellStyle}
                                                    >
                                                        {rowExpansion?.render?.(row)}
                                                    </CTableDataCell>
                                                </CTableRow>
                                            ),
                                        ]
                                    })
                                ) : (
                                    <CTableRow>
                                        <CTableDataCell colSpan={columns.length} className="py-4 text-muted">
                                            {emptyText || 'No records found'}
                                        </CTableDataCell>
                                    </CTableRow>
                                )}
                            </CTableBody>
                        </CTable>
                    )}

                    <CRow className="mt-3 align-items-center">
                        <CCol xs={12} sm={6} className="mb-2 mb-sm-0">
                            {footerLeft || null}
                        </CCol>
                        <CCol xs={12} sm={6} className="d-flex justify-content-start justify-content-sm-end">
                            {pagination?.totalPages ? (
                                <CPagination aria-label="Page navigation">
                                    <CPaginationItem
                                        aria-label="Previous"
                                        disabled={pagination.page <= 1}
                                        onClick={() => pagination.onChange?.(Math.max(1, pagination.page - 1))}
                                        style={{ cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        <span aria-hidden="true">&lsaquo;</span>
                                    </CPaginationItem>

                                    {getPageItems(pagination.page, pagination.totalPages).map((item) => {
                                        if (typeof item !== 'number') {
                                            return (
                                                <CPaginationItem key={item} disabled>
                                                    …
                                                </CPaginationItem>
                                            )
                                        }

                                        return (
                                            <CPaginationItem
                                                key={item}
                                                active={item === pagination.page}
                                                onClick={() => pagination.onChange?.(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {item}
                                            </CPaginationItem>
                                        )
                                    })}

                                    <CPaginationItem
                                        aria-label="Next"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() =>
                                            pagination.onChange?.(Math.min(pagination.totalPages, pagination.page + 1))
                                        }
                                        style={{ cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
                                    >
                                        <span aria-hidden="true">&rsaquo;</span>
                                    </CPaginationItem>
                                </CPagination>
                            ) : null}
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>
        </div>
    )
}

ThemedTablePage.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ),
    activeTabKey: PropTypes.string,
    onTabChange: PropTypes.func,
    actions: PropTypes.shape({
        filtersLabel: PropTypes.string,
        exportLabel: PropTypes.string,
        onExport: PropTypes.func,
        onFilters: PropTypes.func,
        filtersContent: PropTypes.node,
        primary: PropTypes.shape({
            label: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
            color: PropTypes.string,
            disabled: PropTypes.bool,
            icon: PropTypes.node,
        }),
    }),
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.node.isRequired,
            render: PropTypes.func,
            headerClassName: PropTypes.string,
            cellClassName: PropTypes.string,
            headerStyle: PropTypes.object,
            cellStyle: PropTypes.object,
        }),
    ).isRequired,
    rows: PropTypes.array.isRequired,
    rowKey: PropTypes.func,
    getRowClassName: PropTypes.func,
    loading: PropTypes.bool,
    emptyText: PropTypes.string,
    topContent: PropTypes.node,
    footerLeft: PropTypes.node,
    pagination: PropTypes.shape({
        page: PropTypes.number.isRequired,
        totalPages: PropTypes.number.isRequired,
        onChange: PropTypes.func.isRequired,
    }),
    rowExpansion: PropTypes.shape({
        isExpanded: PropTypes.func.isRequired,
        render: PropTypes.func.isRequired,
        rowClassName: PropTypes.string,
        cellClassName: PropTypes.string,
        cellStyle: PropTypes.object,
    }),
    tableClassName: PropTypes.string,
}

export default ThemedTablePage
