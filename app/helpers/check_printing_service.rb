class CheckPrintingService

  def self.test_print
    checks_to_print_to_print = ExpensePayment.where(id: ExpensePayment.last.id)
    checks_pdf = CheckPrintingService.generate_checks(checks_to_print_to_print)
    filename = "/export/checks-20240210092918-#{checks_to_print_to_print.first.hash_id}.pdf"
    File.open("#{Rails.root}#{filename}", "wb") { |f| f.write(checks_pdf.to_pdf) }
    return filename
  end

  def self.generate_checks(checks_to_print)
    pdf = CombinePDF.new
    Linguistics.use( :en )

    y_adjustment = -3

    # Move this to settings eventually?
    y_adjustment = 13 if checks_to_print.first.company_id == 2002 || Rails.env.development?

    checks_to_print.each_with_index do | printed_check, index |
      # Determine the format of the check
      bank_account = printed_check.bank_account

      pdf.new_page()
      #pdf << CombinePDF.load("#{Rails.root}/public/pdfs/check-L80971P.pdf")
      fonts = CombinePDF.new(Rails.root.join('public', 'pdfs','micr-e13b.pdf').to_s).fonts(true)
      CombinePDF.register_font_from_pdf_object(:autography, fonts[0])
      CombinePDF.register_font_from_pdf_object(:micr_e13b, fonts[1])

      text_properties = {font_size: 11, text_align: :left, height: 20, width: 300}

      # If we are printing the whole thing, we have a lot more text to add
      if false && bank_account.check_format == "blank"
        pdf.pages[index].textbox (!bank_account.check_company_name.blank? ? bank_account.check_company_name : printed_check.company.name), text_properties.merge({y: y_adjustment + 752, x: 10, text_align: :center, font_size: 12})
        pdf.pages[index].textbox (!bank_account.check_company_street.blank? ? bank_account.check_company_street : printed_check.company.street + (!printed_check.company.street_2.blank? ? ", #{printed_check.company.street_2}" : "")), text_properties.merge({y: y_adjustment + 738, x: 10, text_align: :center, font_size: 10})
        pdf.pages[index].textbox (!bank_account.check_company_city.blank? ? "#{bank_account.check_company_city}, #{bank_account.check_company_state} #{bank_account.check_company_zip}" : "#{printed_check.company.city}, #{printed_check.company.state} #{printed_check.company.zip}"), text_properties.merge({y: y_adjustment + 728, x: 10, text_align: :center, font_size: 10})
        pdf.pages[index].textbox "PH: #{(!bank_account.check_company_phone.blank? ? bank_account.check_company_phone : printed_check.company.cell_phone)}", text_properties.merge({y: y_adjustment + 716, x: 10, text_align: :center, font_size: 10})

        pdf.pages[index].textbox bank_account.check_bank_name, text_properties.merge({y: y_adjustment + 756, x: 220, font_size: 7, text_align: :center})
        pdf.pages[index].textbox "#{bank_account.check_bank_city}, #{bank_account.check_bank_state}", text_properties.merge({y: y_adjustment + 748, x: 220, font_size: 7, text_align: :center})
        pdf.pages[index].textbox bank_account.check_aba_fractional_number, text_properties.merge({y: y_adjustment + 740, x: 220, font_size: 7, text_align: :center})

        pdf.pages[index].textbox "#{printed_check.check_number.rjust(8, '0')}", text_properties.merge({y: y_adjustment + 750, x: 310, font_size: 18, text_align: :right})

        pdf.pages[index].textbox "________________", text_properties.merge({y: y_adjustment + 712, x: 390, text_align: :center})

        pdf.pages[index].textbox "PAY TO THE", text_properties.merge({y: y_adjustment + 686, x: -10, font_size: 9})
        pdf.pages[index].textbox "ORDER OF  ________________________________________________________________________________", text_properties.merge({y: y_adjustment + 678, x: -10, font_size: 9})

        pdf.pages[index].textbox "$______________", text_properties.merge({y: y_adjustment + 680, x: 445, font_size: 14})

        pdf.pages[index].textbox "_____________________________________________________________________________________ DOLLARS", text_properties.merge({y: y_adjustment + 658, x: -10})

        pdf.pages[index].textbox bank_account.check_signature_heading, text_properties.merge({y: y_adjustment + 645, x: 330, font_size: 7, text_align: :center})
        pdf.pages[index].textbox (!bank_account.check_company_name.blank? ? bank_account.check_company_name : printed_check.company.name), text_properties.merge({y: y_adjustment + 638, x: 330, font_size: 7, text_align: :center})

        pdf.pages[index].textbox "MEMO ____________________________________", text_properties.merge({y: y_adjustment + 586, x: -10})

        pdf.pages[index].textbox "_______________________________", text_properties.merge({y: y_adjustment + 586, x: 330, text_align: :center})
        pdf.pages[index].textbox "AUTHORIZED SIGNATURE", text_properties.merge({y: y_adjustment + 580, x: 330, text_align: :center, font_size: 7})

        pdf.pages[index].textbox "C#{printed_check.check_number.rjust(10, '0')}C", text_properties.merge({y: y_adjustment + 552, x: 44, font: :micr_e13b, font_size: 12})
        pdf.pages[index].textbox "A#{bank_account.routing_number}A#{bank_account.account_number}C", text_properties.merge({y: y_adjustment + 554, x: 175, font: :micr_e13b, font_size: 12})

        # SUMMARY
        pdf.pages[index].textbox "-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------", text_properties.merge({y: y_adjustment + 528, x: -40})
        pdf.pages[index].textbox (!bank_account.check_company_name.blank? ? bank_account.check_company_name : printed_check.company.name), text_properties.merge({y: y_adjustment + 524, x: -10, font_size: 10})
        pdf.pages[index].textbox (!bank_account.check_company_street.blank? ? bank_account.check_company_street : printed_check.company.street + (!printed_check.company.street_2.blank? ? ", #{printed_check.company.street_2}" : "")), text_properties.merge({y: y_adjustment + 514, x: -10, font_size: 10})
        pdf.pages[index].textbox "#{printed_check.check_number.rjust(8, '0')}", text_properties.merge({y: y_adjustment + 510, x: 310, font_size: 18, text_align: :right})

        # SUMMARY 2
        pdf.pages[index].textbox "-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------", text_properties.merge({y: y_adjustment + 276, x: -40})
        pdf.pages[index].textbox (!bank_account.check_company_name.blank? ? bank_account.check_company_name : printed_check.company.name), text_properties.merge({y: y_adjustment + 272, x: -10, font_size: 10})
        pdf.pages[index].textbox (!bank_account.check_company_street.blank? ? bank_account.check_company_street : printed_check.company.street + (!printed_check.company.street_2.blank? ? ", #{printed_check.company.street_2}" : "")), text_properties.merge({y: y_adjustment + 262, x: -10, font_size: 10})
        pdf.pages[index].textbox "#{printed_check.check_number.rjust(8, '0')}", text_properties.merge({y: y_adjustment + 258, x: 310, font_size: 18, text_align: :right})
      end

      pdf.pages[index].textbox "#{PaymentService.todays_date().strftime('%m/%d/%Y')}", text_properties.merge({y: y_adjustment + 718, x: 480})
      pdf.pages[index].textbox "#{printed_check.paid_to}", text_properties.merge({y: y_adjustment + 684, x: 50})
      pdf.pages[index].textbox "#{number_to_currency(printed_check.amount, unit: '')}", text_properties.merge({y: y_adjustment + 684, x: 480})

      # Build the English description of the amount
      dollars = Linguistics::EN::Numbers.number_to_standard_word_groups(printed_check.amount.to_i, " ").join(" ").titleize
      cents = (100 * (printed_check.amount - printed_check.amount.floor)).to_i.to_s

      pdf.pages[index].textbox "#{dollars} & #{cents.rjust(2, '0')}/100  ".ljust(115, '--'), text_properties.merge({y: y_adjustment + 658, x: -10})

      # Add vendor address
      if printed_check.related_object.is_a?(ExpensePayment) && printed_check.related_object&.expense&.vendor.present?

        vendor = printed_check.related_object&.expense&.vendor
        pdf.pages[index].textbox "#{vendor.name}", text_properties.merge({y: y_adjustment + 630, x: 50})
        pdf.pages[index].textbox "#{vendor.street}", text_properties.merge({y: y_adjustment + 619, x: 50})
        pdf.pages[index].textbox "#{vendor.city}, #{vendor.state} #{vendor.zip}", text_properties.merge({y: y_adjustment + 610, x: 50}) if !vendor.city.blank?

      end

      pdf.pages[index].textbox printed_check.memo, text_properties.merge({y: y_adjustment + 590, x: 28})

      if !bank_account.check_signor_name.blank?
        pdf.pages[index].textbox bank_account.check_signor_name, text_properties.merge({y: y_adjustment + 594, x: 330, text_align: :center, font: :autography, font_size: 18})
      end

      (1..2).each do | stub_number |
        pdf.pages[index].textbox "#{printed_check.paid_to}", text_properties.merge({y: y_adjustment + 682 - stub_number * 240, x: -10})
        pdf.pages[index].textbox "#{PaymentService.todays_date().strftime('%m/%d/%Y')}", text_properties.merge({y: y_adjustment + 682 - stub_number * 240, x: 310, text_align: :right})

        pdf.pages[index].textbox printed_check.memo, text_properties.merge({y: y_adjustment + 665 - stub_number * 240, x: -10})
        pdf.pages[index].textbox printed_check.description, text_properties.merge({y: y_adjustment + 665 - stub_number * 240, x: 200})
        pdf.pages[index].textbox "#{number_to_currency(printed_check.amount)}", text_properties.merge({y: y_adjustment + 665 - stub_number * 240, x: 310, text_align: :right})
      end

    end

    return pdf
  end
end