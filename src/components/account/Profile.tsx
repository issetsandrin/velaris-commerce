"use client";

import { useState, type FormEvent } from "react";
import { Mail, MapPin, Pencil, Plus, Star, Trash2, UserRound, Users } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useAuthForm } from "../auth/useAuthForm";
import { AddressCard, formatPostalCode } from "../address/AddressCard";
import { AddressFields, readAddressForm } from "../address/AddressFields";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";
import { createAddress, createContact, deleteAddress, deleteContact, me, updateAddress, updateContact, type Address, type Contact } from "@/lib/api";
import { ContactCard } from "../contact/ContactCard";
import { ContactFields, readContactForm } from "../contact/ContactFields";
import styles from "./Profile.module.css";

export function Profile() {
  const { user, setUser } = useAuth();
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const [addingAddress, setAddingAddress] = useState(false);
  const [busyAddressId, setBusyAddressId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [busyContactId, setBusyContactId] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const contactForm = useAuthForm();

  if (!user) return null;
  const addresses = user.addresses;
  const contacts = user.contacts;
  // Um formulário por seção: cadastrar e editar disputam o mesmo espaço.
  const contactFormOpen = addingContact || editingContact !== null;
  const addressFormOpen = addingAddress || editingAddress !== null;

  function closeContactForm() {
    setAddingContact(false);
    setEditingContact(null);
  }

  function closeAddressForm() {
    setAddingAddress(false);
    setEditingAddress(null);
  }

  function handleNewAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaved(false);
    void run(async () => {
      await createAddress(readAddressForm(form));
      setUser(await me());
      setAddingAddress(false);
      setSaved(true);
    });
  }

  function handleEditAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const alvo = editingAddress;
    if (!alvo) return;
    setSaved(false);
    void run(async () => {
      // Sem `padrao` no envio: a API mantém o que já estava marcado.
      await updateAddress(alvo.id, readAddressForm(form));
      setUser(await me());
      setEditingAddress(null);
      setSaved(true);
    });
  }

  async function handleDefault(address: Address) {
    setBusyAddressId(address.id);
    try {
      await updateAddress(address.id, {
        apelido: address.label ?? undefined,
        cep: address.postalCode,
        cidade: address.city,
        bairro: address.neighborhood ?? "",
        endereco: address.street,
        numero: address.streetNumber,
        complemento: address.complement ?? undefined,
        padrao: true,
      });
      setUser(await me());
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleDelete(address: Address) {
    setBusyAddressId(address.id);
    try {
      await deleteAddress(address.id);
      setUser(await me());
    } finally {
      setBusyAddressId(null);
    }
  }

  function handleNewContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void contactForm.run(async () => {
      await createContact(readContactForm(form));
      setUser(await me());
      setAddingContact(false);
    });
  }

  function handleEditContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const alvo = editingContact;
    if (!alvo) return;
    void contactForm.run(async () => {
      await updateContact(alvo.id, readContactForm(form));
      setUser(await me());
      setEditingContact(null);
    });
  }

  async function handleContactDefault(contact: Contact) {
    setBusyContactId(contact.id);
    try {
      await updateContact(contact.id, {
        nome: contact.name,
        telefone: contact.phone,
        whatsapp: contact.whatsapp ?? undefined,
        cpf: contact.cpf ?? "",
        padrao: true,
      });
      setUser(await me());
    } finally {
      setBusyContactId(null);
    }
  }

  async function handleContactDelete(contact: Contact) {
    setBusyContactId(contact.id);
    try {
      await deleteContact(contact.id);
      setUser(await me());
    } finally {
      setBusyContactId(null);
    }
  }

  return (
    <>
      <section className={styles.card} aria-labelledby="dados">
        <h2 id="dados" className={`title-icon ${styles.cardTitle}`}>
          <Icon icon={UserRound} size={22} />
          Dados da conta
        </h2>
        <dl className={styles.facts}>
          <div>
            <dt>
              <Icon icon={UserRound} size={16} />
              Nome
            </dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>
              <Icon icon={Mail} size={16} />
              E-mail
            </dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card} aria-labelledby="contatos">
        <div className={styles.cardHead}>
          <div>
            <h2 id="contatos" className={`title-icon ${styles.cardTitle}`}>
              <Icon icon={Users} size={22} />
              Contatos
            </h2>
            <p className={styles.muted}>
              {contacts.length === 0
                ? "Quem recebe e responde pelo pedido. Pedimos uma vez e reaproveitamos nas próximas compras."
                : "O contato padrão vem selecionado no checkout."}
            </p>
          </div>
          {!contactFormOpen && (
            <button type="button" className="btn btn-ghost" onClick={() => setAddingContact(true)}>
              <Icon icon={Plus} size={18} />
              Adicionar
            </button>
          )}
        </div>

        {contacts.length > 0 && (
          <div className={styles.addressList}>
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                account
                selected={editingContact?.id === contact.id}
                actions={
                  <>
                    <button type="button" onClick={() => { setAddingContact(false); setEditingContact(contact); }}>
                      <Icon icon={Pencil} size={15} />
                      Editar
                    </button>
                    {!contact.isDefault && (
                      <button type="button" onClick={() => void handleContactDefault(contact)} disabled={busyContactId === contact.id}>
                        <Icon icon={Star} size={15} />
                        Tornar padrão
                      </button>
                    )}
                    <button type="button" onClick={() => void handleContactDelete(contact)} disabled={busyContactId === contact.id}>
                      <Icon icon={Trash2} size={15} />
                      Remover
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}

        {contactFormOpen && (
          <form
            key={editingContact?.id ?? "novo-contato"}
            className={styles.form}
            onSubmit={editingContact ? handleEditContact : handleNewContact}
            noValidate
          >
            <p className={styles.formTitle}>{editingContact ? "Editar contato" : "Novo contato"}</p>
            <ContactFields
              errors={contactForm.fieldErrors}
              defaults={
                editingContact
                  ? {
                      nome: editingContact.name,
                      telefone: editingContact.phone,
                      whatsapp: editingContact.whatsapp ?? "",
                      cpf: editingContact.cpf ?? "",
                    }
                  : { nome: contacts.length === 0 ? user.name : "" }
              }
            />
            {contactForm.formError && (
              <p className={styles.formError} role="alert">
                {contactForm.formError}
              </p>
            )}
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary" disabled={contactForm.submitting}>
                {contactForm.submitting && <Spinner size={16} />}
                {contactForm.submitting ? "Salvando…" : editingContact ? "Salvar alterações" : "Salvar contato"}
              </button>
              <button type="button" className="link-underline" onClick={closeContactForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.card} aria-labelledby="enderecos">
        <div className={styles.cardHead}>
          <div>
            <h2 id="enderecos" className={`title-icon ${styles.cardTitle}`}>
              <Icon icon={MapPin} size={22} />
              Endereços de entrega
            </h2>
            <p className={styles.muted}>
              {addresses.length === 0
                ? "Cadastre um endereço para agilizar o checkout."
                : "O endereço padrão vem selecionado no checkout."}
            </p>
          </div>
          {!addressFormOpen && (
            <button type="button" className="btn btn-ghost" onClick={() => setAddingAddress(true)}>
              <Icon icon={Plus} size={18} />
              Adicionar
            </button>
          )}
        </div>

        {addresses.length > 0 && (
          <div className={styles.addressList}>
            {addresses.map((address, index) => (
              <AddressCard
                key={address.id}
                address={address}
                index={index}
                account
                selected={editingAddress?.id === address.id}
                actions={
                  <>
                    <button type="button" onClick={() => { setAddingAddress(false); setEditingAddress(address); }}>
                      <Icon icon={Pencil} size={15} />
                      Editar
                    </button>
                    {!address.isDefault && (
                      <button type="button" onClick={() => void handleDefault(address)} disabled={busyAddressId === address.id}>
                        <Icon icon={Star} size={15} />
                        Tornar padrão
                      </button>
                    )}
                    <button type="button" onClick={() => void handleDelete(address)} disabled={busyAddressId === address.id}>
                      <Icon icon={Trash2} size={15} />
                      Remover
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}

        {addressFormOpen && (
          <form
            key={editingAddress?.id ?? "novo-endereco"}
            className={styles.form}
            onSubmit={editingAddress ? handleEditAddress : handleNewAddress}
            noValidate
          >
            <p className={styles.formTitle}>{editingAddress ? "Editar endereço" : "Novo endereço"}</p>
            <AddressFields
              errors={fieldErrors}
              defaults={
                editingAddress
                  ? {
                      apelido: editingAddress.label ?? "",
                      cep: formatPostalCode(editingAddress.postalCode),
                      cidade: editingAddress.city,
                      bairro: editingAddress.neighborhood ?? "",
                      endereco: editingAddress.street,
                      numero: editingAddress.streetNumber,
                      complemento: editingAddress.complement ?? "",
                    }
                  : undefined
              }
            />
            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting && <Spinner size={16} />}
                {submitting ? "Salvando…" : editingAddress ? "Salvar alterações" : "Salvar endereço"}
              </button>
              <button type="button" className="link-underline" onClick={closeAddressForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {saved && !addressFormOpen && (
          <p className={styles.saved} role="status">
            Endereço salvo.
          </p>
        )}
      </section>
    </>
  );
}
