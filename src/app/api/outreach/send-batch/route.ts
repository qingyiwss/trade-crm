import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import * as nodemailer from "nodemailer";

interface SmtpConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
}

async function getSmtpConfig(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SmtpConfig | null> {
  const { data, error } = await supabase
    .from("smtp_config")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SmtpConfig;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get SMTP config
  const smtpConfig = await getSmtpConfig(supabase);
  if (!smtpConfig) {
    return NextResponse.json(
      { error: "SMTP not configured" },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.smtp_host || "smtp.gmail.com",
    port: smtpConfig.smtp_port || 587,
    secure: smtpConfig.smtp_port === 465,
    auth: {
      user: smtpConfig.smtp_user,
      pass: smtpConfig.smtp_password,
    },
  });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { customer_ids, subject, body: emailBody } = body;

  // Validate required fields
  if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
    return NextResponse.json(
      { error: "customer_ids must be a non-empty array" },
      { status: 400 }
    );
  }

  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    return NextResponse.json(
      { error: "subject is required" },
      { status: 400 }
    );
  }

  if (!emailBody || typeof emailBody !== "string" || emailBody.trim().length === 0) {
    return NextResponse.json(
      { error: "body is required" },
      { status: 400 }
    );
  }

  // Get customers with their contacts
  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select(`
      id,
      company_name,
      status,
      contacts (
        id,
        name,
        email
      )
    `)
    .in("id", customer_ids);

  if (customersError) {
    return NextResponse.json(
      { error: customersError.message },
      { status: 500 }
    );
  }

  if (!customers || customers.length === 0) {
    return NextResponse.json(
      { error: "No customers found with the provided IDs" },
      { status: 404 }
    );
  }

  let successCount = 0;
  let failCount = 0;

  for (const customer of customers) {
    // Get all email contacts for this customer
    const emailContacts = (customer.contacts as Array<{ id: string; name: string | null; email: string | null }> | null)
      ?.filter((c) => c.email) ?? [];

    if (emailContacts.length === 0) {
      failCount++;
      // Log failed outreach
      await supabase.from("outreach_log").insert({
        customer_id: customer.id,
        channel: "email",
        direction: "outbound",
        subject: subject.trim(),
        content: emailBody.trim(),
        status: "failed",
      });
      continue;
    }

    let sentForCustomer = false;

    for (const contact of emailContacts) {
      try {
        const mailOptions: nodemailer.SendMailOptions = {
          from: `"${smtpConfig.from_name || "TradeCRM"}" <${smtpConfig.smtp_user}>`,
          to: contact.name
            ? `${contact.name} <${contact.email!}>`
            : contact.email!,
          subject: subject.trim(),
          text: emailBody.trim(),
        };

        await transporter.sendMail(mailOptions);

        successCount++;
        sentForCustomer = true;

        // Log successful outreach
        await supabase.from("outreach_log").insert({
          customer_id: customer.id,
          channel: "email",
          direction: "outbound",
          subject: subject.trim(),
          content: emailBody.trim(),
          status: "sent",
        });
      } catch (err: unknown) {
        failCount++;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed to send email to ${contact.email}:`, errorMessage);

        // Log failed outreach
        await supabase.from("outreach_log").insert({
          customer_id: customer.id,
          channel: "email",
          direction: "outbound",
          subject: subject.trim(),
          content: emailBody.trim(),
          status: "failed",
        });
      }
    }

    // Update customer status to 'contacted' if currently 'new'
    if (sentForCustomer && customer.status === "new") {
      await supabase
        .from("customers")
        .update({ status: "contacted" })
        .eq("id", customer.id);
    }
  }

  return NextResponse.json({
    success: true,
    total: customer_ids.length,
    success_count: successCount,
    fail_count: failCount,
  });
}
