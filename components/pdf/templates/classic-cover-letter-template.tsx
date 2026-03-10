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
  black: "#111827",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray700: "#374151",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: colors.black,
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 30,
  },

  /* Sender block with bottom border */
  senderBlock: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    marginBottom: 20,
  },
  senderName: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    color: colors.black,
  },
  senderCity: {
    fontSize: 9,
    color: colors.gray500,
    marginTop: 2,
  },

  /* Recipient block — aligned right */
  recipientBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  recipientCompany: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: colors.black,
  },
  recipientLine: {
    fontSize: 9,
    color: colors.gray700,
    marginTop: 1,
  },

  /* Date line — right-aligned */
  dateLine: {
    textAlign: "right",
    fontSize: 9,
    color: colors.gray500,
    marginBottom: 20,
    marginTop: 8,
  },

  /* Subject with bottom border */
  subjectRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    marginBottom: 18,
  },
  subjectText: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: colors.black,
  },

  /* Opening */
  opening: {
    fontSize: 10,
    color: colors.black,
    marginBottom: 12,
  },

  /* Body paragraphs */
  paragraph: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 10,
  },

  /* Closing formula */
  closing: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 24,
  },

  /* Signature — right-aligned */
  signature: {
    alignSelf: "flex-end",
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: colors.black,
  },

  /* Footer with gray border and centered text */
  footerSpacer: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: colors.gray400,
    fontFamily: "Times-Italic",
  },
});

export function ClassicCoverLetterPdfTemplate({
  data,
}: {
  data: CoverLetterData;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender block */}
        <View style={styles.senderBlock}>
          <Text style={styles.senderName}>{data.senderName}</Text>
          <Text style={styles.senderCity}>{data.senderCity}</Text>
        </View>

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

        {/* Footer */}
        <View style={styles.footerSpacer} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {data.senderName} - {data.senderCity}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
