import NetworkCard from '../components/connectorCards/NetworkCard'
import ProviderExample from '../components/ProviderExample'

export default function Home() {
  return (
    <>
      <div style={{ display: 'flex', flexFlow: 'wrap', fontFamily: 'sans-serif' }}>
        <NetworkCard />
      </div>
    </>
  )
}
