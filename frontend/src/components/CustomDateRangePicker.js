import React, { useState, useEffect } from 'react';
import { DatePicker, Slider, Button } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * CustomDateRangePicker - Chỉ dùng 1 RangePicker với panelRender
 * 
 * Kỹ thuật:
 * - RangePicker tự render 2 calendars (dual view)
 * - panelRender để wrap thêm sidebar + footer
 * - Đơn giản, hiệu quả, ít code hơn
 */
const CustomDateRangePicker = ({ value, onChange, className }) => {
    const [selectedPreset, setSelectedPreset] = useState('custom');
    // Internal state để quản lý range trong picker
    const [internalValue, setInternalValue] = useState(value || null);
    // Sử dụng minutes từ 00:00 (0 minutes) đến 23:59 (1439 minutes)
    const [startMinutes, setStartMinutes] = useState(0); // 00:00
    const [endMinutes, setEndMinutes] = useState(1439); // 23:59

    // Convert minutes to HH:mm format
    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    // Sync internal value with external value prop
    useEffect(() => {
        if (value && value.length === 2) {
            setInternalValue(value);
        }
    }, [value]);

    // Preset shortcuts
    const presets = [
        { key: 'today', label: 'Hôm nay', getValue: () => [dayjs().startOf('day'), dayjs().endOf('day')] },
        { key: 'yesterday', label: 'Hôm qua', getValue: () => [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
        { key: 'last7days', label: '7 ngày qua', getValue: () => [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
        { key: 'last15days', label: '15 ngày qua', getValue: () => [dayjs().subtract(14, 'day').startOf('day'), dayjs().endOf('day')] },
        { key: 'lastMonth', label: 'Tháng trước', getValue: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
        { key: 'custom', label: 'Tùy chỉnh', getValue: null }
    ];

    const handleOk = (currentValue) => {
        if (currentValue && currentValue.length === 2) {
            const [start, end] = currentValue;
            const startTime = minutesToTime(startMinutes);
            const endTime = minutesToTime(endMinutes);
            const [startHour, startMin] = startTime.split(':');
            const [endHour, endMin] = endTime.split(':');

            const finalRange = [
                start.hour(parseInt(startHour)).minute(parseInt(startMin)).second(0).millisecond(0),
                end.hour(parseInt(endHour)).minute(parseInt(endMin)).second(59).millisecond(999)
            ];

            onChange?.(finalRange);
        }
    };

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset.key);
        if (preset.getValue) {
            const newRange = preset.getValue();
            setInternalValue(newRange);
        }
    };

    // panelRender để custom UI với sidebar
    const customPanelRender = (panelNode) => (
        <div style={{ display: 'flex' }}>
            {/* Left Sidebar - Presets */}
            <div style={{
                width: '160px',
                background: '#f8f9fa',
                borderRight: '1px solid #e9ecef',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <div>
                    {presets.map((preset) => (
                        <button
                            key={preset.key}
                            onClick={() => handlePresetClick(preset)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                textAlign: 'left',
                                background: selectedPreset === preset.key ? '#e7f5ff' : 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: selectedPreset === preset.key ? '#1971c2' : '#495057',
                                fontWeight: selectedPreset === preset.key ? '500' : 'normal',
                                marginBottom: '4px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedPreset !== preset.key) {
                                    e.currentTarget.style.background = '#e9ecef';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedPreset !== preset.key) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* OK Button in Sidebar */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e9ecef' }}>
                    <Button
                        type="primary"
                        block
                        onClick={() => {
                            if (internalValue && internalValue.length === 2) {
                                handleOk(internalValue);
                            }
                        }}
                        disabled={!internalValue || internalValue.length !== 2}
                    >
                        Áp dụng
                    </Button>
                </div>
            </div>

            {/* Right Content - Calendar Panels */}
            <div style={{ flex: 1 }}>
                {panelNode}
            </div>
        </div>
    );

    // renderExtraFooter để thêm time controls với slider
    const renderExtraFooter = () => (
        <div style={{
            padding: '16px 20px',
            background: '#ffffff',
            borderTop: '1px solid #e9ecef'
        }}>
            {/* Time Range Slider */}
            <div style={{ paddingLeft: '8px', paddingRight: '8px' }}>
                <Slider
                    range
                    min={0}
                    max={1439}
                    value={[startMinutes, endMinutes]}
                    onChange={([start, end]) => {
                        setStartMinutes(start);
                        setEndMinutes(end);
                    }}
                    tooltip={{
                        formatter: (value) => minutesToTime(value)
                    }}
                    styles={{
                        track: {
                            background: 'linear-gradient(90deg, #1890ff 0%, #52c41a 100%)'
                        },
                        tracks: {
                            background: 'linear-gradient(90deg, #1890ff 0%, #52c41a 100%)'
                        }
                    }}
                />
            </div>
        </div>
    );

    return (
        <>
            <style>
                {`
                    /* Làm nhạt background của khoảng thời gian được chọn */
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-in-range::before {
                        background: #f3f4f6 !important;
                    }
                    
                    /* Làm nhạt background của ô start và end trong range */
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-start:not(.ant-picker-cell-range-start-single)::before,
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-end:not(.ant-picker-cell-range-end-single)::before {
                        background: #f3f4f6 !important;
                    }
                    
                    /* Giữ màu xanh nhạt cho ô hover trong range */
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-in-range.ant-picker-cell-range-hover::before,
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-start.ant-picker-cell-range-hover::before,
                    .custom-date-range-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-end.ant-picker-cell-range-hover::before {
                        background: #e6f4ff !important;
                    }
                `}
            </style>
            <RangePicker
                value={internalValue}
                onChange={(dates) => {
                    if (dates) {
                        setInternalValue(dates);
                        setSelectedPreset('custom');
                    }
                }}
                className={`custom-range-picker ${className || ''}`}
                panelRender={customPanelRender}
                renderExtraFooter={renderExtraFooter}
                showTime={false}
                format="DD/MM/YYYY"
                placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                style={{ width: 'auto' }}
                dropdownClassName="custom-date-range-dropdown"
                styles={{
                    popup: {
                        root: {
                            borderRadius: '8px'
                        }
                    }
                }}
            />
        </>
    );
};

export default CustomDateRangePicker;
