"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────────────────
type Lang = "zh" | "en";

export interface I18nDict {
  nav: {
    dashboard: string;
    customers: string;
    pipeline: string;
    outreach: string;
    prospect: string;
    templates: string;
    settings: string;
  };
  common: {
    back: string;
    save: string;
    cancel: string;
    creating: string;
    saving: string;
    loading: string;
    error: string;
    networkError: string;
    noData: string;
    view: string;
    edit: string;
    delete: string;
    search: string;
    all: string;
    unknown: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    channels: {
      email: string;
      whatsapp: string;
      phone: string;
      linkedin: string;
      instagram: string;
    };
  };
  landing: {
    subtitle: string;
    enterDashboard: string;
    featureCustomerMgmt: string;
    featureCustomerDesc: string;
    featureOutreach: string;
    featureOutreachDesc: string;
    featureDeals: string;
    featureDealsDesc: string;
  };
  dashboard: {
    title: string;
    overview: string;
    customers: string;
    total: string;
    new: string;
    contacted: string;
    replied: string;
    negotiating: string;
    closed: string;
    statusBreakdown: string;
    countryDistribution: string;
    noData: string;
  };
  customers: {
    title: string;
    countSingular: string;
    countPlural: string;
    filtered: string;
    company: string;
    country: string;
    status: string;
    priority: string;
    lastContact: string;
    view: string;
    noResults: string;
    clearFilters: string;
    searchPlaceholder: string;
    statusAll: string;
    statusNew: string;
    statusContacted: string;
    statusReplied: string;
    statusNegotiating: string;
    statusClosed: string;
    addCustomer: string;
    loadingFailed: string;
  };
  addCustomer: {
    title: string;
    companyName: string;
    companyNameRequired: string;
    country: string;
    website: string;
    category: string;
    notes: string;
    cancel: string;
    creating: string;
    create: string;
    failed: string;
    networkError: string;
  };
  outreach: {
    title: string;
    subtitle: string;
    newCustomer: string;
    composeEmail: string;
    customerOptional: string;
    selectCustomer: string;
    to: string;
    useCustomerEmail: string;
    typeManually: string;
    selectCustomerOrType: string;
    template: string;
    selectTemplate: string;
    subject: string;
    body: string;
    send: string;
    sending: string;
    sendToAllNew: string;
    sendingBatch: string;
    emailSent: string;
    noNewCustomers: string;
    fillRequired: string;
    fillSubjectBody: string;
    failedSend: string;
    batchSent: string;
    contactsWithEmail: string;
    globalTemplateConfig: string;
    applyToAll: string;
    selectRecipients: string;
    selectAll: string;
    deselectAll: string;
    unknownContact: string;
    templateOverride: string;
    useGlobal: string;
    customSubject: string;
    customBody: string;
    sendAll: string;
    sendResults: string;
    noRecipients: string;
    loadFailed: string;
  };
  templates: {
    title: string;
    subtitle: string;
    newTemplate: string;
    createTemplate: string;
    editTemplate: string;
    templateName: string;
    templateNamePlaceholder: string;
    subject: string;
    subjectPlaceholder: string;
    body: string;
    bodyPlaceholder: string;
    fillAllFields: string;
    created: string;
    updated: string;
    deleted: string;
    noTemplates: string;
    createFirst: string;
    confirmDelete: string;
    loadFailed: string;
    saveFailed: string;
    deleteFailed: string;
  };
  prospect: {
    title: string;
    newSearch: string;
    product: string;
    country: string;
    search: string;
    taskList: string;
    status: string;
    results: string;
    createdAt: string;
    refresh: string;
    pending: string;
    running: string;
    completed: string;
    failed: string;
    deepMine: string;
    deepMineCreated: string;
    deepMineHint: string;
  };
  settings: {
    title: string;
    subtitle: string;
    smtpConfig: string;
    smtpHost: string;
    smtpHostDefault: string;
    smtpPort: string;
    smtpPortDefault: string;
    smtpUser: string;
    appPassword: string;
    appPasswordHint: string;
    appPasswordGmail: string;
    fromName: string;
    fromNameHint: string;
    saveSettings: string;
    saving: string;
    saved: string;
    hostRequired: string;
    userRequired: string;
    loadFailed: string;
    saveFailed: string;
  };
  customerDetail: {
    backToCustomers: string;
    companyDetails: string;
    created: string;
    notes: string;
    noNotes: string;
    contacts: string;
    noContacts: string;
    primary: string;
    outreachHistory: string;
    noOutreach: string;
    unknown: string;
    edit: string;
    cancelEdit: string;
    source: string;
    star: string;
    unstar: string;
    contactStage: string;
    emailThread: string;
    inbound: string;
    outbound: string;
  };
  editCustomer: {
    title: string;
    status: string;
    priority: string;
    notes: string;
    notesPlaceholder: string;
    saveChanges: string;
    saving: string;
    cancel: string;
    failed: string;
  };
  addContact: {
    title: string;
    name: string;
    nameRequired: string;
    jobTitle: string;
    email: string;
    phone: string;
    whatsapp: string;
    linkedin: string;
    instagram: string;
    save: string;
    saving: string;
    cancel: string;
    failed: string;
  };
  addOutreach: {
    title: string;
    channel: string;
    status: string;
    subject: string;
    content: string;
    log: string;
    saving: string;
    cancel: string;
    failed: string;
  };
  pipeline: {
    title: string;
    new: string;
    sent: string;
    replied: string;
    negotiating: string;
    won: string;
    lost: string;
    changeStage: string;
    lastContacted: string;
    noContacts: string;
    starOnly: string;
  };
  newCustomer: {
    title: string;
    backToCustomers: string;
    companyName: string;
    companyNameRequired: string;
    country: string;
    website: string;
    category: string;
    notes: string;
    cancel: string;
    creating: string;
    create: string;
    failed: string;
    networkError: string;
  };
}

// ── Chinese dictionary (default) ──────────────────────────────────
export const zh: I18nDict = {
  nav: {
    dashboard: "仪表盘",
    customers: "客户",
    pipeline: "管线",
    outreach: "邮件",
    prospect: "客户挖掘",
    templates: "模板",
    settings: "设置",
  },
  common: {
    back: "返回",
    save: "保存",
    cancel: "取消",
    creating: "创建中...",
    saving: "保存中...",
    loading: "加载中...",
    error: "出错了",
    networkError: "网络错误，请重试",
    noData: "暂无数据",
    view: "查看",
    edit: "编辑",
    delete: "删除",
    search: "搜索",
    all: "全部",
    unknown: "未知",
    today: "今天",
    yesterday: "昨天",
    daysAgo: "天前",
    channels: {
      email: "邮件",
      whatsapp: "WhatsApp",
      phone: "电话",
      linkedin: "LinkedIn",
      instagram: "Instagram",
    },
  },
  landing: {
    subtitle: "管理您的贸易客户，跟踪营销进度，一站式成交更多订单。",
    enterDashboard: "进入仪表盘",
    featureCustomerMgmt: "客户管理",
    featureCustomerDesc: "整理和追踪所有贸易联系人。",
    featureOutreach: "智能营销",
    featureOutreachDesc: "自动化消息发送与跟进。",
    featureDeals: "交易跟踪",
    featureDealsDesc: "从线索到成交全程监控。",
  },
  dashboard: {
    title: "TradeCRM",
    overview: "仪表盘概览",
    customers: "客户",
    total: "总计",
    new: "新建",
    contacted: "已联系",
    replied: "已回复",
    negotiating: "洽谈中",
    closed: "已成交",
    statusBreakdown: "状态分布",
    countryDistribution: "国家分布",
    noData: "暂无客户数据",
  },
  customers: {
    title: "客户",
    countSingular: "个客户",
    countPlural: "个客户",
    filtered: "(已筛选)",
    company: "公司",
    country: "国家",
    status: "状态",
    priority: "优先级",
    lastContact: "最近联系",
    view: "查看",
    noResults: "未找到客户",
    clearFilters: "清除筛选",
    searchPlaceholder: "搜索公司...",
    statusAll: "全部状态",
    statusNew: "新建",
    statusContacted: "已联系",
    statusReplied: "已回复",
    statusNegotiating: "洽谈中",
    statusClosed: "已成交",
    addCustomer: "添加客户",
    loadingFailed: "加载客户失败",
  },
  addCustomer: {
    title: "添加客户",
    companyName: "公司名称",
    companyNameRequired: "公司名称不能为空",
    country: "国家",
    website: "网站",
    category: "类别",
    notes: "备注",
    cancel: "取消",
    creating: "创建中...",
    create: "创建客户",
    failed: "创建客户失败",
    networkError: "网络错误，请重试",
  },
  outreach: {
    title: "邮件营销",
    subtitle: "撰写并发送邮件给客户",
    newCustomer: "个新客户",
    composeEmail: "撰写邮件",
    customerOptional: "客户 (可选)",
    selectCustomer: "-- 选择客户 (或手动输入) --",
    to: "收件人",
    useCustomerEmail: "使用客户邮箱",
    typeManually: "手动输入",
    selectCustomerOrType: "选择客户或手动输入",
    template: "模板",
    selectTemplate: "-- 选择模板 --",
    subject: "主题",
    body: "正文",
    send: "发送",
    sending: "发送中...",
    sendToAllNew: "发送给所有新客户",
    sendingBatch: "批量发送中...",
    emailSent: "邮件发送成功！",
    noNewCustomers: "没有可发送的新客户",
    fillRequired: "请填写所有必填字段：收件人、主题和正文",
    fillSubjectBody: "发送前请填写主题和正文",
    failedSend: "邮件发送失败",
    batchSent: "批量发送完成！成功 {success}，失败 {fail}，共 {total} 个客户。",
    contactsWithEmail: "个联系人",
    globalTemplateConfig: "全局模板配置",
    applyToAll: "应用到所有已选收件人",
    selectRecipients: "选择收件人",
    selectAll: "全选",
    deselectAll: "取消全选",
    unknownContact: "未命名联系人",
    templateOverride: "模板覆盖",
    useGlobal: "使用全局模板",
    customSubject: "自定义主题...",
    customBody: "自定义正文...",
    sendAll: "发送全部",
    sendResults: "发送结果",
    noRecipients: "请先选择收件人",
    loadFailed: "加载数据失败",
  },
  templates: {
    title: "邮件模板",
    subtitle: "管理邮件模板",
    newTemplate: "新建模板",
    createTemplate: "创建模板",
    editTemplate: "编辑模板",
    templateName: "模板名称",
    templateNamePlaceholder: "输入模板名称...",
    subject: "主题",
    subjectPlaceholder: "输入邮件主题...",
    body: "正文",
    bodyPlaceholder: "输入邮件正文...",
    fillAllFields: "请填写所有字段",
    created: "模板创建成功！",
    updated: "模板更新成功！",
    deleted: "模板已删除",
    noTemplates: "暂无模板",
    createFirst: "创建第一个模板",
    confirmDelete: "确定要删除此模板吗？",
    loadFailed: "加载模板失败",
    saveFailed: "保存模板失败",
    deleteFailed: "删除模板失败",
  },
  prospect: {
    title: "客户挖掘",
    newSearch: "新建搜索",
    product: "产品",
    country: "国家",
    search: "搜索",
    taskList: "任务列表",
    status: "状态",
    results: "结果",
    createdAt: "创建时间",
    refresh: "刷新",
    pending: "待处理",
    running: "运行中",
    completed: "已完成",
    failed: "失败",
    deepMine: "深度挖掘",
    deepMineCreated: "深度挖掘已创建",
    deepMineHint: "此功能将深度搜索潜在客户信息",
  },
  settings: {
    title: "设置",
    subtitle: "配置 SMTP 邮件设置",
    smtpConfig: "SMTP 配置",
    smtpHost: "SMTP 主机",
    smtpHostDefault: "默认: smtp.gmail.com",
    smtpPort: "SMTP 端口",
    smtpPortDefault: "默认: 587 (TLS)。常用端口: 587 (TLS), 465 (SSL), 25。",
    smtpUser: "邮箱 (SMTP 用户)",
    appPassword: "应用密码",
    appPasswordHint: "留空以保持当前密码",
    appPasswordGmail: "对于 Gmail，请使用 Google 账号设置中的应用密码。",
    fromName: "发件人名称",
    fromNameHint: '显示在邮件"发件人"字段的名称。',
    saveSettings: "保存设置",
    saving: "保存中...",
    saved: "SMTP 设置保存成功！",
    hostRequired: "SMTP 主机不能为空",
    userRequired: "邮箱 (SMTP 用户) 不能为空",
    loadFailed: "加载 SMTP 配置失败",
    saveFailed: "保存设置失败",
  },
  customerDetail: {
    backToCustomers: "返回客户列表",
    companyDetails: "公司详情",
    created: "创建于",
    notes: "备注",
    noNotes: "暂无备注",
    contacts: "联系人",
    noContacts: "暂无联系人",
    primary: "主要",
    outreachHistory: "营销历史",
    noOutreach: "暂无营销记录",
    unknown: "未知",
    edit: "编辑",
    cancelEdit: "取消编辑",
    source: "来源",
    star: "收藏",
    unstar: "取消收藏",
    contactStage: "联系人阶段",
    emailThread: "邮件往来",
    inbound: "收件",
    outbound: "发件",
  },
  editCustomer: {
    title: "编辑客户",
    status: "状态",
    priority: "优先级",
    notes: "备注",
    notesPlaceholder: "添加关于此客户的备注...",
    saveChanges: "保存更改",
    saving: "保存中...",
    cancel: "取消",
    failed: "更新失败",
  },
  addContact: {
    title: "添加联系人",
    name: "姓名",
    nameRequired: "姓名不能为空",
    jobTitle: "职位",
    email: "邮箱",
    phone: "电话",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    save: "保存联系人",
    saving: "保存中...",
    cancel: "取消",
    failed: "添加联系人失败",
  },
  addOutreach: {
    title: "记录营销",
    channel: "渠道",
    status: "状态",
    subject: "主题",
    content: "内容",
    log: "记录营销",
    saving: "保存中...",
    cancel: "取消",
    failed: "记录营销失败",
  },
  pipeline: {
    title: "销售管线",
    new: "未联系",
    sent: "已发信",
    replied: "已回复",
    negotiating: "洽谈中",
    won: "已成交",
    lost: "已放弃",
    changeStage: "变更阶段",
    lastContacted: "最近联系",
    noContacts: "暂无联系人",
    starOnly: "只看星标",
  },
  newCustomer: {
    title: "添加客户",
    backToCustomers: "返回客户列表",
    companyName: "公司名称",
    companyNameRequired: "公司名称不能为空",
    country: "国家",
    website: "网站",
    category: "类别",
    notes: "备注",
    cancel: "取消",
    creating: "创建中...",
    create: "创建客户",
    failed: "创建客户失败",
    networkError: "网络错误，请重试",
  },
};

// ── English dictionary ────────────────────────────────────────────
export const en: I18nDict = {
  nav: {
    dashboard: "Dashboard",
    customers: "Customers",
    pipeline: "Pipeline",
    outreach: "Outreach",
    prospect: "Prospect",
    templates: "Templates",
    settings: "Settings",
  },
  common: {
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    creating: "Creating...",
    saving: "Saving...",
    loading: "Loading...",
    error: "Error",
    networkError: "Network error. Please try again.",
    noData: "No data",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    all: "All",
    unknown: "Unknown",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: "d ago",
    channels: {
      email: "Email",
      whatsapp: "WhatsApp",
      phone: "Phone",
      linkedin: "LinkedIn",
      instagram: "Instagram",
    },
  },
  landing: {
    subtitle:
      "Manage your trade customers, track outreach, and close more deals — all in one place.",
    enterDashboard: "Enter Dashboard",
    featureCustomerMgmt: "Customer Management",
    featureCustomerDesc: "Organize and track all your trade contacts.",
    featureOutreach: "Smart Outreach",
    featureOutreachDesc: "Automated messaging and follow-ups.",
    featureDeals: "Deal Tracking",
    featureDealsDesc: "Monitor progress from lead to close.",
  },
  dashboard: {
    title: "TradeCRM",
    overview: "Dashboard Overview",
    customers: "Customers",
    total: "Total",
    new: "New",
    contacted: "Contacted",
    replied: "Replied",
    negotiating: "Negotiating",
    closed: "Closed",
    statusBreakdown: "Status Breakdown",
    countryDistribution: "Country Distribution",
    noData: "No customer data yet.",
  },
  customers: {
    title: "Customers",
    countSingular: "customer",
    countPlural: "customers",
    filtered: "(filtered)",
    company: "Company",
    country: "Country",
    status: "Status",
    priority: "Priority",
    lastContact: "Last Contact",
    view: "View",
    noResults: "No customers found",
    clearFilters: "Clear filters",
    searchPlaceholder: "Search companies...",
    statusAll: "All Status",
    statusNew: "New",
    statusContacted: "Contacted",
    statusReplied: "Replied",
    statusNegotiating: "Negotiating",
    statusClosed: "Closed",
    addCustomer: "Add Customer",
    loadingFailed: "Failed to load customers",
  },
  addCustomer: {
    title: "Add Customer",
    companyName: "Company Name",
    companyNameRequired: "Company name is required.",
    country: "Country",
    website: "Website",
    category: "Category",
    notes: "Notes",
    cancel: "Cancel",
    creating: "Creating...",
    create: "Create Customer",
    failed: "Failed to create customer.",
    networkError: "Network error. Please try again.",
  },
  outreach: {
    title: "Email Outreach",
    subtitle: "Compose and send emails to customers",
    newCustomer: "new customer",
    composeEmail: "Compose Email",
    customerOptional: "Customer (optional)",
    selectCustomer: "-- Select customer (or type manually) --",
    to: "To",
    useCustomerEmail: "Use customer email",
    typeManually: "Type manually",
    selectCustomerOrType: "Select a customer or type manually",
    template: "Template",
    selectTemplate: "-- Select a template --",
    subject: "Subject",
    body: "Body",
    send: "Send",
    sending: "Sending...",
    sendToAllNew: "Send to All New",
    sendingBatch: "Sending Batch...",
    emailSent: "Email sent successfully!",
    noNewCustomers: "No new customers to send to",
    fillRequired: "Please fill in all required fields: To, Subject, and Body",
    fillSubjectBody: "Please fill in Subject and Body before sending",
    failedSend: "Failed to send email",
    batchSent:
      "Batch sent! {success} succeeded, {fail} failed out of {total} customers.",
    contactsWithEmail: "contacts",
    globalTemplateConfig: "Global Template Config",
    applyToAll: "Apply to all selected",
    selectRecipients: "Select Recipients",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    unknownContact: "Unnamed Contact",
    templateOverride: "Template Override",
    useGlobal: "Use global template",
    customSubject: "Custom subject...",
    customBody: "Custom body...",
    sendAll: "Send All",
    sendResults: "Send Results",
    noRecipients: "Please select recipients first",
    loadFailed: "Failed to load data",
  },
  templates: {
    title: "Email Templates",
    subtitle: "Manage email templates",
    newTemplate: "New Template",
    createTemplate: "Create Template",
    editTemplate: "Edit Template",
    templateName: "Template Name",
    templateNamePlaceholder: "Enter template name...",
    subject: "Subject",
    subjectPlaceholder: "Enter email subject...",
    body: "Body",
    bodyPlaceholder: "Enter email body...",
    fillAllFields: "Please fill in all fields",
    created: "Template created successfully!",
    updated: "Template updated successfully!",
    deleted: "Template deleted",
    noTemplates: "No templates yet",
    createFirst: "Create your first template",
    confirmDelete: "Are you sure you want to delete this template?",
    loadFailed: "Failed to load templates",
    saveFailed: "Failed to save template",
    deleteFailed: "Failed to delete template",
  },
  prospect: {
    title: "Prospect",
    newSearch: "New Search",
    product: "Product",
    country: "Country",
    search: "Search",
    taskList: "Task List",
    status: "Status",
    results: "Results",
    createdAt: "Created At",
    refresh: "Refresh",
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    deepMine: "Deep Mine",
    deepMineCreated: "Deep mine created",
    deepMineHint: "Deep search for potential customer information",
  },
  settings: {
    title: "Settings",
    subtitle: "Configure SMTP email settings",
    smtpConfig: "SMTP Configuration",
    smtpHost: "SMTP Host",
    smtpHostDefault: "Default: smtp.gmail.com",
    smtpPort: "SMTP Port",
    smtpPortDefault:
      "Default: 587 (TLS). Common ports: 587 (TLS), 465 (SSL), 25.",
    smtpUser: "Email (SMTP User)",
    appPassword: "App Password",
    appPasswordHint: "Leave unchanged to keep current password",
    appPasswordGmail:
      "For Gmail, use an App Password from your Google Account settings.",
    fromName: "From Name",
    fromNameHint:
      'Display name shown in the "From" field of outgoing emails.',
    saveSettings: "Save Settings",
    saving: "Saving...",
    saved: "SMTP settings saved successfully!",
    hostRequired: "SMTP Host is required",
    userRequired: "Email (SMTP User) is required",
    loadFailed: "Failed to load SMTP configuration",
    saveFailed: "Failed to save settings",
  },
  customerDetail: {
    backToCustomers: "Back to Customers",
    companyDetails: "Company Details",
    created: "Created",
    notes: "Notes",
    noNotes: "No notes yet.",
    contacts: "Contacts",
    noContacts: "No contacts yet.",
    primary: "Primary",
    outreachHistory: "Outreach History",
    noOutreach: "No outreach logged yet.",
    unknown: "Unknown",
    edit: "Edit",
    cancelEdit: "Cancel Edit",
    source: "Source",
    star: "Star",
    unstar: "Unstar",
    contactStage: "Contact Stage",
    emailThread: "Email Thread",
    inbound: "Inbound",
    outbound: "Outbound",
  },
  editCustomer: {
    title: "Edit Customer",
    status: "Status",
    priority: "Priority",
    notes: "Notes",
    notesPlaceholder: "Add notes about this customer...",
    saveChanges: "Save Changes",
    saving: "Saving...",
    cancel: "Cancel",
    failed: "Failed to update",
  },
  addContact: {
    title: "Add Contact",
    name: "Name",
    nameRequired: "Name is required",
    jobTitle: "Title",
    email: "Email",
    phone: "Phone",
    whatsapp: "WhatsApp",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    save: "Save Contact",
    saving: "Saving...",
    cancel: "Cancel",
    failed: "Failed to add contact",
  },
  addOutreach: {
    title: "Log Outreach",
    channel: "Channel",
    status: "Status",
    subject: "Subject",
    content: "Content",
    log: "Log Outreach",
    saving: "Saving...",
    cancel: "Cancel",
    failed: "Failed to log outreach",
  },
  pipeline: {
    title: "Pipeline",
    new: "New",
    sent: "Sent",
    replied: "Replied",
    negotiating: "Negotiating",
    won: "Won",
    lost: "Lost",
    changeStage: "Change Stage",
    lastContacted: "Last Contacted",
    noContacts: "No contacts",
    starOnly: "Starred only",
  },
  newCustomer: {
    title: "Add Customer",
    backToCustomers: "Back to Customers",
    companyName: "Company Name",
    companyNameRequired: "Company name is required.",
    country: "Country",
    website: "Website",
    category: "Category",
    notes: "Notes",
    cancel: "Cancel",
    creating: "Creating...",
    create: "Create Customer",
    failed: "Failed to create customer.",
    networkError: "Network error. Please try again.",
  },
};

// ── Standalone t() function ────────────────────────────────────────
export function t(key: string, lang: Lang = "zh", params?: Record<string, string | number>): string {
  const dict = lang === "zh" ? zh : en;
  const keys = key.split(".");
  let value: unknown = dict;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  let result = typeof value === "string" ? value : key;
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{${paramKey}}`, String(paramValue));
    }
  }
  return result;
}

// ── React context ──────────────────────────────────────────────────
interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "zh",
  setLang: () => {},
  toggleLang: () => {},
});

const STORAGE_KEY = "tracerm-lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh") return stored;
  return "zh";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getInitialLang());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, [lang, mounted]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "zh" ? "en" : "zh"));
  }, []);

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ lang: "zh", setLang, toggleLang }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── useI18n hook ───────────────────────────────────────────────────
export function useI18n() {
  const { lang, setLang, toggleLang } = useContext(I18nContext);

  const tFn = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return t(key, lang, params);
    },
    [lang]
  );

  return useMemo(
    () => ({ t: tFn, lang, setLang, toggleLang }),
    [tFn, lang, setLang, toggleLang]
  );
}
