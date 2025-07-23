class EfsReports::HeaderSection < EfsReports::EfsReportSection

  def generate_html(for_pdf = false)
    html_parts = Array.new

    html_parts << '<div class="report-header">' unless self.single_table
    html_parts << '<div class="row">'
    html_parts << '<div class="col-md-12">'
    html_parts << "<h1>#{@report.title}"
    html_parts << ' <img src="/images/spinner.gif" width="20" height="20" id="loading">' unless for_pdf
    html_parts << '</h1>'
    #html_parts << "<h2 id=\"filters-header\">Filters</h2>"
    html_parts << '<div id="report-criteria">'

    criteria_blocks = Array.new
    self.report.criteria.each do | criteria_class, criterion |
      items = criterion.header_items(for_pdf)
      criteria_blocks << items.join('&nbsp;|&nbsp;&nbsp;')
    end

    html_parts << criteria_blocks.join("&nbsp;\n")
    html_parts << '</div>'
    html_parts << '</div>'
    html_parts << '</div>'
    html_parts << ':report_toolbar' unless for_pdf
    html_parts << '</div>' unless self.single_table

    self.output = html_parts.join("\n")
  end
  
  def generate_csv
    csv_parts = Array.new

    @report.title.split('<br>').each {| title_part | csv_parts << CSV.generate_line([title_part], {force_quotes: true}) }

    items = Array.new
    self.report.criteria.each do | criteria_class, criterion |
      items |= criterion.header_items(true)
    end

    csv_parts << CSV.generate_line(items, {force_quotes: true})

    self.output = csv_parts.join("")
  end

end