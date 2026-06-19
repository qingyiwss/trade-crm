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

  const { customer_id, template_id, to_email, to_name, subject, body: emailBody } = body;

  // Validate required fields
  if (!customer_id || typeof customer_id !== "string") {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  if (!to_email || typeof to_email !== "string") {
    return NextResponse.json(
      { error: "to_email is required" },
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

  // Verify customer exists
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, status, company_name")
    .eq("id", customer_id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Send email
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${smtpConfig.from_name || "TradeCRM"}" <${smtpConfig.smtp_user}>`,
      to: to_email.trim(),
      subject: subject.trim(),
      text: emailBody.trim(),
    };

    if (to_name && typeof to_name === "string") {
      mailOptions.to = `${to_name.trim()} <${to_email.trim()}>`;
    }

    const info = await transporter.sendMail(mailOptions);

    // Log outreach
    const { error: logError } = await supabase
      .from("outreach_log")
      .insert({
        customer_id: customer_id,
        channel: "email",
        direction: "outbound",
        subject: subject.trim(),
        content: emailBody.trim(),
        status: "sent",
      });

    if (logError) {
      console.error("Failed to log outreach:", logError.message);
    }

    // Update customer status to 'contacted' if currently 'new'
    if (customer.status === "new") {
      const { error: updateError } = await supabase
        .from("customers")
        .update({ status: "contacted" })
        .eq("id", customer_id);

      if (updateError) {
        console.error("Failed to update customer status:", updateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message_id: info.messageId,
      customer_id,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown email error";
    console.error("Email send failed:", errorMessage);

    // Log failed outreach
    await supabase
      .from("outreach_log")
      .insert({
        customer_id: customer_id,
        channel: "email",
        direction: "outbound",
        subject: subject.trim(),
        content: emailBody.trim(),
        status: "failed",
      });

    return NextResponse.json(
      { error: `Failed to send email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
