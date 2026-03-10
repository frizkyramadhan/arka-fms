// ** Redirect root ke Dashboard Maintenance (ARKA MMS)
export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboards/maintenance',
      permanent: false
    }
  }
}

const Home = () => null

export default Home
