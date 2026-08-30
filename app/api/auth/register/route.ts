import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, getUserByEmail } from "@/lib/auth";
import { sendMail, MANAGER_EMAIL } from "@/lib/mail";
import { orgFormLabel, ORG_FORMS } from "@/lib/orgForms";

const REQUIRED_FIELDS = [
  "email",
  "password",
  "name",
  "phone",
  "orgForm",
  "legalName",
  "legalAddress",
  "inn",
  "bankAccount",
  "bankName",
  "bankBik",
] as const;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
    }
  }

  if (!ORG_FORMS.some((f) => f.value === body.orgForm)) {
    return NextResponse.json({ error: "Некорректная организационно-правовая форма" }, { status: 400 });
  }

  if (body.orgForm === "ooo" && !body.kpp) {
    return NextResponse.json({ error: "Для ООО обязательно укажите КПП" }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });
  }

  const user = await createUser({
    email,
    password: body.password,
    name: body.name,
    phone: body.phone,
    orgForm: body.orgForm,
    legalName: body.legalName,
    legalAddress: body.legalAddress,
    inn: body.inn,
    kpp: body.kpp || null,
    bankAccount: body.bankAccount,
    bankName: body.bankName,
    bankBik: body.bankBik,
    bankCorrAccount: body.bankCorrAccount || null,
    deliveryAddress: body.deliveryAddress || null,
  });

  await createSession(user.id);

  sendMail({
    to: MANAGER_EMAIL,
    subject: `Новый пользователь: ${user.name}`,
    html: `
      <h2>Новая регистрация на ruskist.ru</h2>
      <p><b>Имя:</b> ${user.name}<br>
      <b>Телефон:</b> ${user.phone}<br>
      <b>Email:</b> ${user.email}</p>
      <h3>Реквизиты</h3>
      <p>
        <b>Форма:</b> ${orgFormLabel(user.orgForm)}<br>
        <b>Название/ФИО:</b> ${user.legalName}<br>
        <b>Юридический адрес:</b> ${user.legalAddress}<br>
        <b>ИНН:</b> ${user.inn}${user.kpp ? `<br><b>КПП:</b> ${user.kpp}` : ""}<br>
        <b>Расчётный счёт:</b> ${user.bankAccount}<br>
        <b>Банк:</b> ${user.bankName}<br>
        <b>БИК:</b> ${user.bankBik}${user.bankCorrAccount ? `<br><b>Корр. счёт:</b> ${user.bankCorrAccount}` : ""}
        ${user.deliveryAddress ? `<br><b>Адрес доставки:</b> ${user.deliveryAddress}` : ""}
      </p>
    `,
  }).catch((err) => console.error("Не удалось отправить письмо о регистрации:", err));

  return NextResponse.json({ ok: true });
}
