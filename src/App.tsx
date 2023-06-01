import React, { useEffect, useState } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';
import { Container, List, ListItem, Typography } from '@material-ui/core';

function App() {
  const [dividends, setDividends] = useState<any[]>([]);

  const fetchDividends = async () => {
    const { data } = await axios.get('https://www.stockwatch.pl/dywidendy/');
    const $ = cheerio.load(data);
    const table = $('#DividendsTab');
    const rows = $('tbody tr', table);

    let tableDividends: any[] = [];

    rows.each((i, row) => {
      const paymentStatusData = $(row).find('td').eq(6).text().trim();
      // Only dividends that have not been paid yet
      if (!paymentStatusData.includes('wypłacono')) {
        const company = $(row).find('td').eq(0).text().trim();
        const period = $(row).find('td').eq(1).text().trim();
        const dividendPerShare = $(row).find('td').eq(2).text().trim();
        let yieldDividend = $(row).find('td').eq(3).text().trim();
        // Replace comma with dot
        yieldDividend = yieldDividend.replace(',', '.');
        const exDividendDate = $(row).find('td').eq(4).text().trim();
        const exDividendTradingDate = $(row).find('td').eq(5).text().trim();

        // Extract payment status and date
        let paymentStatus = '';
        let paymentDate = '';

        const paymentStatusMatch = paymentStatusData.match(/([^\d]+)/);
        if (paymentStatusMatch) {
          paymentStatus = paymentStatusMatch[1].trim();
        }

        const paymentDateMatch = paymentStatusData.match(/(\d{4}-\d{2}-\d{2})/);
        if (paymentDateMatch) {
          paymentDate = paymentDateMatch[1].trim();
        }

        const agmDate = $(row).find('td').eq(7).text().trim();

        tableDividends.push({
          company,
          period,
          dividendPerShare,
          yieldDividend,
          exDividendDate,
          exDividendTradingDate,
          paymentStatus,
          paymentDate,
          agmDate,
        });
      }
    });

    setDividends(tableDividends);
  };

  useEffect(() => {
    fetchDividends();
  }, []);

  const getListDividend = (dividends: any[]) => {
    const currentDate = new Date();

    // Filtrowanie dywidend, które mają dzień dywidendy za 5 dni od teraz
    const filteredDividends = dividends.filter(dividends => {
      return new Date(dividends.exDividendDate) > currentDate
    })

    // Sortowanie dywidend wg. dnia dywidendy
    filteredDividends.sort((a, b) => {
      const dateA = new Date(a.exDividendDate);
      const dateB = new Date(b.exDividendDate);
      return dateA.getTime() - dateB.getTime();
    });

    console.log(filteredDividends)

    return filteredDividends;
  };

  const schedule = getListDividend(dividends);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom style={{ padding: 20 }}>
        Harmonogram dywidend
      </Typography>
      <List style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {schedule.map((dividend: any) => (
          <ListItem key={dividend.company} style={{
            width: "260px",
            height: "180px"
          }}>
            <div
              style={{
                border: dividend.yieldDividend.replace(",", ".").replace("%", "") > 10 ? '2px solid red' : 'transparent',
                padding: '10px',
              }}
            >
              <div>
                <Typography variant="h6" component="h2">
                  {dividend.company}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {`Dzień dywidendy: ${dividend.exDividendDate}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {`Data wypłaty: ${dividend.paymentDate}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Zwrot: {dividend.yieldDividend.replace(",", ".").replace("%", "")}%
                </Typography>
                  <Typography variant="body2" color="textSecondary">
                  Dywidenda na akcje: {dividend.dividendPerShare}zł
                </Typography>

              </div>
            </div>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default App;
