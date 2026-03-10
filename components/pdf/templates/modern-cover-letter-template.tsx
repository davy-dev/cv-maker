"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CoverLetterData } from "@/types/cv";

const colors = {
  navy: "#0f172a",
  blue: "#2563eb",
  white: "#ffffff",
  gray600: "#4b5563",
  gray700: "#374151",
  gray900: "#111827",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.gray700,
  },

  /* Dark navy header bar */
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  senderName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  senderCity: {
    fontSize: 9,
    color: colors.white,
    marginTop: 2,
    opacity: 0.85,
  },

  /* Body content */
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 30,
    flex: 1,
  },

  /* Recipient block — aligned right */
  recipientBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  recipientCompany: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray900,
  },
  recipientLine: {
    fontSize: 9,
    color: colors.gray600,
    marginTop: 1,
  },

  /* Date line — right-aligned */
  dateLine: {
    textAlign: "right",
    fontSize: 9,
    color: colors.gray600,
    marginBottom: 20,
    marginTop: 8,
  },

  /* Subject with blue left border */
  subjectRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
    paddingLeft: 10,
    marginBottom: 18,
  },
  subjectText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray900,
  },

  /* Opening */
  opening: {
    fontSize: 9,
    color: colors.gray700,
    marginBottom: 12,
  },

  /* Body paragraphs */
  paragraph: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.6,
    textAlign: "justify",
    marginBottom: 10,
  },

  /* Closing formula */
  closing: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.6,
    textAlign: "justify",
    marginBottom: 20,
  },

  /* Signature — right-aligned */
  signature: {
    alignSelf: "flex-end",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray900,
  },

  /* Blue footer bar */
  footer: {
    height: 2,
    backgroundColor: colors.blue,
  },
});

export function ModernCoverLetterPdfTemplate({
  data,
}: {
  data: CoverLetterData;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Dark navy header */}
        <View style={styles.header}>
          <Text style={styles.senderName}>{data.senderName}</Text>
          <Text style={styles.senderCity}>{data.senderCity}</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Recipient block */}
          <View style={styles.recipientBlock}>
            <Text style={styles.recipientCompany}>
              {data.recipient.companyName}
            </Text>
            {data.recipient.contactName && (
              <Text style={styles.recipientLine}>
                {data.recipient.contactName}
              </Text>
            )}
            {data.recipient.contactTitle && (
              <Text style={styles.recipientLine}>
                {data.recipient.contactTitle}
              </Text>
            )}
            {data.recipient.address && (
              <Text style={styles.recipientLine}>
                {data.recipient.address}
              </Text>
            )}
            {data.recipient.city && (
              <Text style={styles.recipientLine}>
                {data.recipient.city}
              </Text>
            )}
          </View>

          {/* Date */}
          <Text style={styles.dateLine}>
            {data.senderCity}, le {data.date}
          </Text>

          {/* Subject */}
          <View style={styles.subjectRow}>
            <Text style={styles.subjectText}>Objet : {data.subject}</Text>
          </View>

          {/* Opening */}
          <Text style={styles.opening}>{data.opening},</Text>

          {/* Body paragraphs */}
          <Text style={styles.paragraph}>{data.introduction}</Text>
          <Text style={styles.paragraph}>{data.motivation}</Text>
          <Text style={styles.paragraph}>{data.skillsMatch}</Text>
          <Text style={styles.paragraph}>{data.conclusion}</Text>

          {/* Closing formula */}
          <Text style={styles.closing}>{data.closing}</Text>

          {/* Signature */}
          <Text style={styles.signature}>{data.senderName}</Text>
        </View>

        {/* Blue footer bar */}
        <View style={styles.footer} />
      </Page>
    </Document>
  );
}
