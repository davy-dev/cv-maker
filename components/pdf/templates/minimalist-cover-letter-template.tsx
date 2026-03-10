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
  primary: "#222222",
  secondary: "#9ca3af",
  body: "#4b5563",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.body,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 36,
  },

  /* Sender — lightweight */
  senderName: {
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  senderCity: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 3,
    marginBottom: 28,
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
    color: colors.primary,
  },
  recipientLine: {
    fontSize: 9,
    color: colors.secondary,
    marginTop: 1,
  },

  /* Date line — right-aligned */
  dateLine: {
    textAlign: "right",
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 24,
    marginTop: 8,
  },

  /* Subject with uppercase label */
  subjectLabel: {
    fontSize: 7,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 20,
  },

  /* Opening */
  opening: {
    fontSize: 9,
    color: colors.body,
    marginBottom: 14,
  },

  /* Body paragraphs */
  paragraph: {
    fontSize: 9,
    color: colors.body,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 10,
  },

  /* Closing formula */
  closing: {
    fontSize: 9,
    color: colors.body,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 24,
  },

  /* Signature — right-aligned */
  signature: {
    alignSelf: "flex-end",
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.3,
  },
});

export function MinimalistCoverLetterPdfTemplate({
  data,
}: {
  data: CoverLetterData;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender */}
        <Text style={styles.senderName}>{data.senderName}</Text>
        <Text style={styles.senderCity}>{data.senderCity}</Text>

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

        {/* Subject with uppercase label */}
        <Text style={styles.subjectLabel}>OBJET</Text>
        <Text style={styles.subjectText}>{data.subject}</Text>

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
      </Page>
    </Document>
  );
}
